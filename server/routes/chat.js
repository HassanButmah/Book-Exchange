const express = require('express');
const router = express.Router();
const pool = require('../db');

let lastBook = null;

router.post('/', async (req, res) => {
    try {

        const { message } = req.body;

        if (!message) {
            return res.json({
                reply: 'يرجى كتابة رسالة.'
            });
        }

        // =========================
        // استخراج النية واسم الكتاب بواسطة Groq API
        // =========================

        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) {
            return res.status(500).json({
                reply: 'خطأ: مفتاح API لم يتم تكوينه. اتصل بمسؤول النظام.'
            });
        }

        const llmResponse = await fetch(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${groqApiKey}`
                },
                body: JSON.stringify({
                    model: 'mixtral-8x7b-32768',
                    messages: [{
                        role: 'user',
                        content: `أنت مساعد لمنصة تبادل الكتب الجامعية. 

استخرج ONLY JSON بالشكل التالي (بدون نص إضافي):

{
  "intent": "OWNER|AVAILABILITY|CONDITION|SEARCH|OTHER",
  "book": "اسم الكتاب أو فارغ",
  "contextFromLastMessage": true/false
}

أمثلة:

رسالة: مين صاحب كتاب Operating System
{
  "intent": "OWNER",
  "book": "Operating System",
  "contextFromLastMessage": false
}

رسالة: مين مالك كتاب Database Design؟
{
  "intent": "OWNER",
  "book": "Database Design",
  "contextFromLastMessage": false
}

رسالة: هل متاح؟
{
  "intent": "AVAILABILITY",
  "book": "",
  "contextFromLastMessage": true
}

رسالة المستخدم:
${message}

أجب JSON فقط بدون نص إضافي.`
                    }],
                    temperature: 0.3,
                    max_tokens: 200
                })
            }
        );

        const llmData = await llmResponse.json();

        if (!llmResponse.ok) {
            console.error('Groq API Error:', llmData);
            return res.status(500).json({
                reply: 'خطأ في معالجة الرسالة. حاول مرة أخرى.'
            });
        }

let parsed;

try {

    const responseText = llmData.choices?.[0]?.message?.content || '';
    if (!responseText) {
        throw new Error('No response from Groq');
    }

    const cleanResponse = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

    parsed = JSON.parse(cleanResponse);

} catch (err) {

    console.error('Parse error:', err);
    console.log('Raw Groq response:', llmData);

    return res.json({
        reply: 'معذرة، لم أتمكن من فهم سؤالك. جرب مثلاً: "من صاحب كتاب Database Design؟"'
    });
}

if (!parsed.intent) {
    return res.json({
        reply: 'معذرة، لم أتمكن من فهم سؤالك. اسأل عن صاحب الكتاب أو توفره.'
    });
}

const intent = parsed.intent;
let searchText = parsed.book?.trim() || '';

const followUpWords = [
    'متاح',
    'متوفر',
    'موجود',
    'صاحبه',
    'صاحبه',
    'المالك',
    'حالته',
    'حالة',
    'هو',
    'هذا',
    'ذلك'
];

if (
    searchText &&
    followUpWords.includes(searchText.toLowerCase())
) {
    searchText = '';
}

console.log('Intent:', intent);
console.log('Book:', searchText);

    
        // =========================
        // متابعة آخر كتاب
        // =========================

        if (
    lastBook &&
    (
        !searchText ||
        searchText.length === 0
    )
) {

            if (intent === 'OWNER') {
                return res.json({
                    reply: `صاحب كتاب "${lastBook.title}" هو ${lastBook.owner_name}.`
                });
            }

            if (intent === 'CONDITION') {
                return res.json({
                    reply: `حالة كتاب "${lastBook.title}" هي ${lastBook.condition}.`
                });
            }

            if (intent === 'AVAILABILITY') {
                return res.json({
                    reply: lastBook.is_available
                        ? `نعم، كتاب "${lastBook.title}" متاح للتبادل.`
                        : `لا، كتاب "${lastBook.title}" غير متاح حالياً.`
                });
            }
        }

        // =========================
        // البحث عن الكتاب
        // =========================

        const result = await pool.query(
            `
            SELECT
                b.id,
                b.title,
                b.description,
                b.condition,
                b.is_available,
                b.status,
                u.name AS owner_name
            FROM books b
            JOIN users u
                ON b.owner_id = u.id
            WHERE
                b.is_visible = TRUE
                AND (
                    b.title ILIKE $1
                    OR b.description ILIKE $1
                )
            LIMIT 1
            `,
            [`%${searchText}%`]
        );


        const book = result.rows[0];

        if (!book) {
            return res.json({
                reply: 'لم أجد هذا الكتاب في المنصة.'
            });
        }

        // حفظ آخر كتاب
        lastBook = book;

        // =========================
        // OWNER
        // =========================

        if (intent === 'OWNER') {
            return res.json({
                reply: `صاحب كتاب "${book.title}" هو ${book.owner_name}.`
            });
        }

        // =========================
        // AVAILABILITY
        // =========================

        if (intent === 'AVAILABILITY') {
            return res.json({
                reply: book.is_available
                    ? `نعم، كتاب "${book.title}" متاح للتبادل.`
                    : `لا، كتاب "${book.title}" غير متاح حالياً.`
            });
        }

        // =========================
        // CONDITION
        // =========================

        if (intent === 'CONDITION') {
            return res.json({
                reply: `حالة كتاب "${book.title}" هي ${book.condition}.`
            });
        }

        // =========================
        // SEARCH
        // =========================

        if (intent === 'SEARCH') {
            return res.json({
                reply: book.is_available
                    ? `نعم، كتاب "${book.title}" موجود ومتاح للتبادل.`
                    : `نعم، كتاب "${book.title}" موجود لكنه غير متاح حالياً.`
            });
        }

        // =========================
        // OTHER - استخدم Groq للإجابة الحرة
        // =========================

        const answerResponse = await fetch(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${groqApiKey}`
                },
                body: JSON.stringify({
                    model: 'mixtral-8x7b-32768',
                    messages: [{
                        role: 'user',
                        content: `أنت مساعد ذكي لمنصة تبادل الكتب الجامعية.

بيانات الكتاب:
${book ? JSON.stringify(book, null, 2) : 'لا توجد بيانات كتاب محددة'}

السؤال من المستخدم:
${message}

أجب بالعربية وباختصار (جملة أو اثنتان فقط). كن مفيداً وودياً.`
                    }],
                    temperature: 0.7,
                    max_tokens: 150
                })
            }
        );

        const answerData = await answerResponse.json();

        if (!answerResponse.ok) {
            console.error('Groq answer API error:', answerData);
            return res.json({
                reply: 'معذرة، حدث خطأ في معالجة الرسالة. جرب سؤال آخر.'
            });
        }

        const answerText = answerData.choices?.[0]?.message?.content || 'معذرة، لم أتمكن من الإجابة على سؤالك.';

        return res.json({
            reply: answerText
        });

    } catch (err) {

        console.error('CHAT ERROR:', err);

        return res.status(500).json({
            reply: 'حدث خطأ في الخادم. تأكد من إعدادات API.'
        });
    }
});

module.exports = router;