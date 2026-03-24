const PANDADOC_API_KEY = "b46d94036aceab59c6446124b145b5efdcff4ee1";

async function testPandaDoc() {
    try {
        const response = await fetch('https://api.pandadoc.com/public/v1/documents', {
            method: 'GET',
            headers: {
                'Authorization': `API-Key ${PANDADOC_API_KEY}`
            }
        });
        
        console.log("Status:", response.status);
        const data = await response.json();
        console.log("Data:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error:", error);
    }
}

testPandaDoc();
