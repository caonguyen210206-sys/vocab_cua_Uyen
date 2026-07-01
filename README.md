# Vocab cua Uyen

Web app prototype cho hệ thống học từ vựng Anh - Việt, chuyển từ workflow Google Sheets sang giao diện web.

## Chức năng chính

- Dashboard theo dõi tiến độ
- Vocabulary Library: kho từ tổng
- My Vocab List: danh sách từ đang học
- Practice / Vocab Test: Random Set -> Quiz Submit -> Clear & Save
- Review & Score log
- Monthly Review
- Settings cho API key demo

## Cách chạy

Mở file `index.html` trực tiếp trong trình duyệt, hoặc bật GitHub Pages cho repo này.

## Workflow Practice

1. Chọn Language, số câu, 3 criteria.
2. Bấm `Random Set` để tạo bộ câu hỏi.
3. Nhập đáp án trong các ô Your Answer.
4. Bấm `Quiz Submit` để chấm điểm và hiện Correct Answer.
5. Bấm `Clear & Save` để lưu vào Review & Score và cập nhật mastery.

## Ghi chú

Bản này lưu dữ liệu bằng `localStorage` trong trình duyệt. API key trong Settings là demo frontend; bản production cần backend để bảo mật key.