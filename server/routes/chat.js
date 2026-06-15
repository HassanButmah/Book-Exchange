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
        // استخراج النية واسم الكتاب بواسطة Qwen
        // =========================

        const llmResponse = await fetch(
            'http://localhost:11434/api/generate',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'qwen2.5:1.5b',
                    prompt: `
أنت مساعد لمنصة تبادل الكتب.

استخرج JSON فقط بالشكل التالي:

{
  "intent": "OWNER|AVAILABILITY|CONDITION|SEARCH|OTHER",
  "book": "اسم الكتاب أو فارغ"
}

أمثلة:

رسالة: مين صاحب كتاب Operating System
{
  "intent": "OWNER",
  "book": "Operating System"
}

رسالة: مين مالك كتاب Database Design
{
  "intent": "OWNER",
  "book": "Database Design"
}

رسالة: هل كتاب Database Design متاح؟
{
  "intent": "AVAILABILITY",
  "book": "Database Design"
}

رسالة: ما حالة كتاب Operating System؟
{
  "intent": "CONDITION",
  "book": "Operating System"
}

رسالة: مين صاحبه؟
{
  "intent": "OWNER",
  "book": ""
}

رسالة: هل هو متوفر؟
{
  "intent": "AVAILABILITY",
  "book": ""
}

رسالة المستخدم:
${message}

أجب JSON فقط.
`,
                    stream: false
                })
            }
        );

        const llmData = await llmResponse.json();

let parsed;

try {

    const cleanResponse = llmData.response
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

    parsed = JSON.parse(cleanResponse);

} catch (err) {

    console.log('RAW QWEN:', llmData.response);

    return res.json({
        reply: 'لم أفهم سؤالك.'
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
        // Qwen للإجابة الحرة
        // =========================

        const answerResponse = await fetch(
            'http://localhost:11434/api/generate',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'qwen2.5:1.5b',
                    prompt: `
أنت مساعد لمنصة تبادل الكتب.

اعتمد فقط على البيانات التالية:
مهم جداً:

إذا كانت الرسالة مثل:

متاح؟
موجود؟
حالته؟
صاحبه؟
مين صاحبه؟
هل ما زال متوفراً؟

فيجب أن يكون:

{
  "intent": "...",
  "book": ""
}

ولا تضع أبداً الكلمات:
متاح
موجود
حالته
صاحبه

داخل book.

${JSON.stringify(book, null, 2)}

السؤال:
${message}

أجب بالعربية وباختصار.
`,
                    stream: false
                })
            }
        );

        const answerData = await answerResponse.json();

        return res.json({
            reply: answerData.response
        });

    } catch (err) {

        console.error('CHAT ERROR:', err);

        return res.status(500).json({
            reply: 'حدث خطأ في الخادم.'
        });
    }
});

module.exports = router;