// No base44 import needed for this public proxy

Deno.serve(async (req) => {
    try {
        const { state, city, street } = await req.json();

        if (!state || !city || !street || street.length < 3) {
            return new Response(JSON.stringify({ error: 'State, city, and a street query of at least 3 characters are required.' }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }
        
        const encodedState = encodeURIComponent(state);
        const encodedCity = encodeURIComponent(city);
        const encodedStreet = encodeURIComponent(street);
        
        const apiUrl = `https://brasilapi.com.br/api/cep/v2/${encodedState}/${encodedCity}/${encodedStreet}`;

        const apiResponse = await fetch(apiUrl, {
            headers: { 'Accept': 'application/json' }
        });

        if (!apiResponse.ok) {
            if (apiResponse.status === 404) {
                 return new Response(JSON.stringify([]), {
                    status: 200,
                    headers: { "Content-Type": "application/json" }
                });
            }
            throw new Error(`BrasilAPI request failed with status ${apiResponse.status}`);
        }
        
        const data = await apiResponse.json();

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error in searchAddressByStreet function:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
});