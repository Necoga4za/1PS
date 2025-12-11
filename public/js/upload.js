document.addEventListener('DOMContentLoaded', () => {
    const imageFile = document.getElementById('image-file');
    const imagePreview = document.getElementById('image-preview');
    const uploadLabel = document.querySelector('.upload-label');
    const placeholderText = document.querySelector('.placeholder-text');

    imageFile.addEventListener('change', function(event) {
        const file = event.target.files[0];

        if (file) {
            const reader = new FileReader();

            reader.onload = function(e) {
                // 미리보기 이미지의 소스 설정
                imagePreview.src = e.target.result;
                // 미리보기 이미지 표시
                imagePreview.style.display = 'block';
                // '이미지 업로드 영역' 텍스트 숨김
                placeholderText.style.display = 'none';
                // 점선 테두리 제거 (선택 사항)
                uploadLabel.style.border = 'none'; 
            };

            reader.readAsDataURL(file);
        } else {
            // 파일 선택 취소 시 초기 상태로 복원
            imagePreview.src = '#';
            imagePreview.style.display = 'none';
            placeholderText.style.display = 'block';
            uploadLabel.style.border = 'none'; // 필요하다면 다시 dashed border 설정
        }
    });
});