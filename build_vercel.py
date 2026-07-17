import os
import shutil

# Thư mục gốc dự án
BASE_DIR = r"D:\n3n\CPM5.0"
SRC_DIR = os.path.join(BASE_DIR, "03_Outputs")
DIST_DIR = os.path.join(BASE_DIR, "dist_vercel")

print("Bat dau build tinh cho Vercel...")

# 1. Don dep va tao moi thu muc build
if os.path.exists(DIST_DIR):
    shutil.rmtree(DIST_DIR)
shutil.copytree(SRC_DIR, DIST_DIR)
print(f"Da sao chep 03_Outputs sang {DIST_DIR}")

# 1b. Dam bao vercel.json (cau hinh routing Vercel) luon ton tai trong ban build.
# rmtree o tren xoa het dist_vercel nen file nay bi mat neu 03_Outputs khong co.
# Uu tien copy tu 03_Outputs neu co, neu khong thi ghi cau hinh mac dinh.
VERCEL_JSON = os.path.join(DIST_DIR, "vercel.json")
SRC_VERCEL_JSON = os.path.join(SRC_DIR, "vercel.json")
if not os.path.exists(VERCEL_JSON):
    if os.path.exists(SRC_VERCEL_JSON):
        shutil.copyfile(SRC_VERCEL_JSON, VERCEL_JSON)
        print("Da khoi phuc vercel.json tu 03_Outputs")
    else:
        with open(VERCEL_JSON, "w", encoding="utf-8") as f:
            f.write('{\n  "cleanUrls": true\n}\n')
        print("Da tao vercel.json mac dinh (cleanUrls)")

# 2. Doc noi dung file api.html de nhung (inline)
api_path = os.path.join(DIST_DIR, "pages", "api.html")
if not os.path.exists(api_path):
    print("LOI: Khong tim thay file api.html!")
    exit(1)

with open(api_path, "r", encoding="utf-8") as f:
    api_content = f.read()

# 3. Quet va thay the noi dung trong tat ca cac file HTML trong thu muc build
for root, dirs, files in os.walk(DIST_DIR):
    for file in files:
        if file.endswith(".html"):
            file_path = os.path.join(root, file)
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Thay the include('api') bang noi dung thuc te cua api.html
            modified = content.replace("<?!= include('api'); ?>", api_content)
            modified = modified.replace("<?!= include('pages/api'); ?>", api_content)
            
            # Cap nhat isLocal de ho tro vercel.app
            modified = modified.replace("window.location.hostname === '127.0.0.1'", 
                                        "window.location.hostname === '127.0.0.1' || window.location.hostname.endsWith('.vercel.app')")
            
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(modified)
            print(f"Da xu ly file: {file}")

print("Hoan tat dong goi tinh!")
