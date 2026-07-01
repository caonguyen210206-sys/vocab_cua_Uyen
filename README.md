# Vocab cua Uyen

Web app prototype cho hệ thống học từ vựng Anh - Việt. Bản này đã chuyển workflow từ Google Sheets sang web app tự động hơn, ít thao tác thủ công hơn.

## Workflow tối ưu

### 1. Thêm từ

- Vào `Vocab List` hoặc `Dashboard`.
- Bấm `Add Word`.
- Nhập từ mới.
- App tự tạo dữ liệu demo: IPA, loại từ, nghĩa, định nghĩa, ví dụ, synonym, antonym, band, topic.

### 2. Luyện nhanh

- Vào `Practice`.
- Chọn mode:
  - `Due words`: ưu tiên từ điểm thấp / cần ôn.
  - `Weak words`: chỉ lấy từ yếu.
  - `New words`: lấy từ mới.
  - `Random all`: random toàn bộ.
- Chọn Language, số câu và 3 criteria.
- Bấm `Auto Random Set`.
- Nhập đáp án.
- Bấm `Submit & Auto Save`.

Sau khi submit, app tự động:

- Chấm điểm từng dòng.
- Hiện Correct Answer.
- Lưu vào Review & Score.
- Cập nhật L3Ds.
- Cập nhật mastery/status của từ.

### 3. Review tháng

- Vào `Monthly Review`.
- Chọn Topic/Band/Language/Criteria.
- Làm bài.
- Bấm `Submit Review` để chấm.
- Bấm `Save Review` để lưu log.

## Trang chính

- `Dashboard`: KPI, queue từ cần ôn, quick actions.
- `Library`: kho từ tổng.
- `Vocab List`: danh sách từ đang học.
- `Practice`: luyện nhanh batch quiz.
- `Monthly Review`: ôn tập theo filter.
- `Settings`: cấu hình số câu, strict checking, API key placeholder.

## Cách chạy

Mở `index.html` trực tiếp trong trình duyệt hoặc bật GitHub Pages:

`Settings` → `Pages` → `Deploy from a branch` → `main` → `/root`.

Link Pages dự kiến:

`https://caonguyen210206-sys.github.io/vocab_cua_Uyen/`

## Ghi chú kỹ thuật

- Dữ liệu lưu bằng `localStorage` trong trình duyệt.
- API key trong Settings chỉ là placeholder demo. Bản production cần backend để bảo mật key.
- Không còn checkbox/script như Google Sheets; tất cả nút là nút web thật.