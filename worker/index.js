export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;
        const method = request.method;

        // CORS headers
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };

        if (method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            if (path === "/api/files") {
                if (method === "GET") {
                    const { results } = await env.DB.prepare("SELECT * FROM files ORDER BY created_at ASC").all();
                    return Response.json(results, { headers: corsHeaders });
                } else if (method === "POST") {
                    const body = await request.json();
                    const { id, parent_id, title, type, content, created_at } = body;
                    await env.DB.prepare(
                        "INSERT INTO files (id, parent_id, title, type, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
                    )
                        .bind(id, parent_id || null, title, type, content || null, created_at, created_at)
                        .run();
                    return Response.json({ success: true }, { headers: corsHeaders });
                }
            } else if (path.startsWith("/api/files/")) {
                const id = path.split("/").pop();
                if (method === "PUT") {
                    const body = await request.json();
                    // Check what fields are being updated
                    if (body.title !== undefined) {
                        await env.DB.prepare("UPDATE files SET title = ?, updated_at = ? WHERE id = ?")
                            .bind(body.title, Date.now(), id)
                            .run();
                    }
                    if (body.content !== undefined) {
                        await env.DB.prepare("UPDATE files SET content = ?, updated_at = ? WHERE id = ?")
                            .bind(body.content, Date.now(), id)
                            .run();
                    }
                    return Response.json({ success: true }, { headers: corsHeaders });
                } else if (method === "DELETE") {
                    // Recursive delete: collect all descendant IDs
                    const idsToDelete = [id];
                    let currentLevel = [id];

                    // Find all descendants recursively
                    while (currentLevel.length > 0) {
                        const placeholders = currentLevel.map(() => '?').join(',');
                        const { results } = await env.DB.prepare(
                            `SELECT id FROM files WHERE parent_id IN (${placeholders})`
                        ).bind(...currentLevel).all();

                        currentLevel = results.map(r => r.id);
                        idsToDelete.push(...currentLevel);
                    }

                    // Delete all collected IDs
                    for (const deleteId of idsToDelete) {
                        await env.DB.prepare("DELETE FROM files WHERE id = ?").bind(deleteId).run();
                    }

                    return Response.json({ success: true }, { headers: corsHeaders });
                }
            }

            return new Response("Not Found", { status: 404, headers: corsHeaders });
        } catch (e) {
            return new Response(e.message, { status: 500, headers: corsHeaders });
        }
    },
};
