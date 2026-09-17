let selectedImageBase64 = "";

// Đọc file ảnh từ thư viện/album điện thoại và nén Base64
document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("file-image-input");
  if (fileInput) {
    fileInput.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          selectedImageBase64 = event.target.result;
          const preview = document.getElementById("image-preview");
          if (preview) preview.src = selectedImageBase64;
        };
        reader.readAsDataURL(file);
      }
    });
  }
  loadAdminFiles();
});

// 1. Tải danh sách file từ Cloudflare D1
async function loadAdminFiles() {
  const listContainer = document.getElementById("admin-files-table");
  if (!listContainer) return;
  listContainer.innerHTML = "<tr><td colspan='5'>Đang tải từ D1 Database...</td></tr>";

  try {
    const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/admin/files`, {
      headers: { "X-Admin-Token": window.APP_CONFIG.ADMIN_TOKEN }
    });
    const result = await res.json();

    if (!result.success) {
      listContainer.innerHTML = `<tr><td colspan='5'>Lỗi: ${result.message}</td></tr>`;
      return;
    }

    if (result.data.length === 0) {
      listContainer.innerHTML = "<tr><td colspan='5'>Chưa có file nào trong database.</td></tr>";
      return;
    }

    listContainer.innerHTML = result.data.map(item => `
      <tr>
        <td><img src="${item.image_url || 'assets/img/default-avatar.svg'}" width="40" height="40" style="border-radius:4px; object-fit:cover;"></td>
        <td><strong>${item.title}</strong><br><small>${item.tag} | ${item.points_required} điểm</small></td>
        <td><span class="badge ${item.status === 'active' ? 'badge-active' : 'badge-hidden'}">${item.status}</span></td>
        <td>
          <button onclick="toggleFileStatus(${item.id})">${item.status === 'active' ? 'Ẩn' : 'Hiện'}</button>
          <button onclick="deleteFile(${item.id})" style="color:red;">Xóa</button>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    listContainer.innerHTML = "<tr><td colspan='5'>Không kết nối được server backend.</td></tr>";
  }
}

// 2. Thêm file mới vào D1 Database
async function submitNewFile(e) {
  e.preventDefault();
  const title = document.getElementById("file-title").value;
  const tag = document.getElementById("file-tag").value;
  const points = document.getElementById("file-points").value;
  const fileUrl = document.getElementById("file-download-url").value;

  const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/admin/files`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Token": window.APP_CONFIG.ADMIN_TOKEN
    },
    body: JSON.stringify({
      title,
      tag,
      points: Number(points),
      fileUrl,
      imageUrl: selectedImageBase64
    })
  });

  const data = await res.json();
  if (data.success) {
    alert("Thêm file thành công vào D1! Mọi máy khác đều sẽ thấy.");
    document.getElementById("add-file-form").reset();
    selectedImageBase64 = "";
    loadAdminFiles();
  } else {
    alert(data.message || "Lỗi khi lưu");
  }
}

// 3. Ẩn / Hiện file
async function toggleFileStatus(id) {
  await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/admin/files/toggle/${id}`, {
    method: "POST",
    headers: { "X-Admin-Token": window.APP_CONFIG.ADMIN_TOKEN }
  });
  loadAdminFiles();
}

// 4. Xóa file vĩnh viễn
async function deleteFile(id) {
  if (!confirm("Bạn chắc chắn muốn xóa file này khỏi Database?")) return;
  await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/admin/files/${id}`, {
    method: "DELETE",
    headers: { "X-Admin-Token": window.APP_CONFIG.ADMIN_TOKEN }
  });
  loadAdminFiles();
}
