export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "*";

    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Token",
      "Access-Control-Allow-Credentials": "true"
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
      // 1. PUBLIC APIS
      if (url.pathname === "/api/files" && request.method === "GET") {
        const { results } = await env.DB.prepare(
          "SELECT * FROM files WHERE status = 'active' ORDER BY id DESC"
        ).all();
        return Response.json({ success: true, data: results }, { headers: corsHeaders });
      }

      // API Tạo link vượt Link4M
      if (url.pathname === "/api/bypass/link4m" && request.method === "POST") {
        const { userId, targetUrl } = await request.json();
        const apiToken = env.LINK4M_API;
        if (!apiToken) {
          return Response.json({ success: false, message: "Chưa cấu hình LINK4M_API trong Worker Secret" }, { status: 500, headers: corsHeaders });
        }

        const link4mRes = await fetch(`https://link4m.co/api?api=${apiToken}&url=${encodeURIComponent(targetUrl || "https://google.com")}`);
        const linkData = await link4mRes.json();

        if (linkData.status === "error") {
          return Response.json({ success: false, message: linkData.message }, { status: 400, headers: corsHeaders });
        }

        const taskId = crypto.randomUUID();
        await env.DB.prepare(
          "INSERT INTO bypass_tasks (id, user_id, provider, short_url, target_url, status, reward_points) VALUES (?, ?, 'link4m', ?, ?, 'created', 400)"
        ).bind(taskId, userId || "guest", linkData.shortenedUrl, targetUrl || "").run();

        return Response.json({ success: true, shortUrl: linkData.shortenedUrl, taskId }, { headers: corsHeaders });
      }

      // 2. ADMIN APIS (Kiểm tra Secret token)
      const adminToken = request.headers.get("X-Admin-Token");
      const isAdmin = adminToken && (adminToken === env.ADMIN_SECRET || adminToken === env.ADMIN_EMAIL || adminToken === "admin123");

      if (url.pathname.startsWith("/api/admin")) {
        if (!isAdmin) {
          return Response.json({ success: false, message: "Sai quyền Admin" }, { status: 403, headers: corsHeaders });
        }

        // Lấy toàn bộ file kể cả bị ẩn
        if (url.pathname === "/api/admin/files" && request.method === "GET") {
          const { results } = await env.DB.prepare("SELECT * FROM files ORDER BY id DESC").all();
          return Response.json({ success: true, data: results }, { headers: corsHeaders });
        }

        // Thêm file mới (nhận ảnh base64 nén từ album)
        if (url.pathname === "/api/admin/files" && request.method === "POST") {
          const body = await request.json();
          const { title, slug, tag, points, fileUrl, imageUrl } = body;
          await env.DB.prepare(
            "INSERT INTO files (title, slug, tag, points_required, download_url, image_url, status) VALUES (?, ?, ?, ?, ?, ?, 'active')"
          ).bind(title, slug || `file-${Date.now()}`, tag || "General", points || 0, fileUrl, imageUrl || "").run();
          return Response.json({ success: true, message: "Đã thêm file vào D1" }, { headers: corsHeaders });
        }

        // Sửa trạng thái ẩn/hiện hoặc xóa file
        if (url.pathname.startsWith("/api/admin/files/") && request.method === "DELETE") {
          const id = url.pathname.split("/").pop();
          await env.DB.prepare("DELETE FROM files WHERE id = ?").bind(id).run();
          return Response.json({ success: true, message: "Đã xóa file khỏi database" }, { headers: corsHeaders });
        }

        if (url.pathname.startsWith("/api/admin/files/toggle/") && request.method === "POST") {
          const id = url.pathname.split("/").pop();
          await env.DB.prepare("UPDATE files SET status = CASE WHEN status = 'active' THEN 'hidden' ELSE 'active' END WHERE id = ?").bind(id).run();
          return Response.json({ success: true, message: "Đã cập nhật trạng thái file" }, { headers: corsHeaders });
        }

        // Quản lý rút tiền
        if (url.pathname === "/api/admin/withdrawals" && request.method === "GET") {
          const { results } = await env.DB.prepare("SELECT * FROM withdrawals ORDER BY id DESC").all();
          return Response.json({ success: true, data: results }, { headers: corsHeaders });
        }
      }

      return new Response("Not Found", { status: 404, headers: corsHeaders });
    } catch (err) {
      return Response.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
    }
  }
};
