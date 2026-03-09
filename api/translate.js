module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text, targetLang = 'tr' } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        let translatedText = '';
        if (data && data[0]) {
            for (const part of data[0]) {
                if (part[0]) {
                    translatedText += part[0];
                }
            }
        }

        return res.status(200).json({ 
            translatedText,
            originalText: text,
            targetLang 
        });

    } catch (error) {
        console.error('Translation error:', error);
        return res.status(500).json({ error: 'Translation failed' });
    }
};
