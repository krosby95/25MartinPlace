// Cloudflare Worker — lists photos in R2 bucket
// Deploy this at: Cloudflare Dashboard → Workers & Pages → Create Worker
// Add R2 binding: Settings → Bindings → R2 Bucket → Variable name: PHOTOS_BUCKET → your bucket

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // List all objects, handling pagination
    let objects = []
    let cursor = undefined

    do {
      const listed = await env.PHOTOS_BUCKET.list({ limit: 1000, cursor })
      objects = objects.concat(listed.objects)
      cursor = listed.truncated ? listed.cursor : undefined
    } while (cursor)

    // Filter to images, sort oldest-first so new uploads appear at the end
    const files = objects
      .filter(o => /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(o.key))
      .sort((a, b) => new Date(a.uploaded) - new Date(b.uploaded))
      .map(o => o.key)

    return new Response(JSON.stringify(files), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}
