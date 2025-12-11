document.addEventListener('DOMContentLoaded', () => {
    // 필요한 요소들을 가져옵니다.
    const gridItems = document.querySelectorAll('.grid-item');
    const modal = document.getElementById('myModal');
    const closeButton = document.querySelector('.close-button');
    const modalImage = document.getElementById('modal-image');
    const modalSentenceDisplay = document.getElementById('modal-sentence-display');
    const unlikeButton = document.getElementById('unlike-button');
    
    let currentItemId = null; // 현재 모달이 보여주는 그리드 아이템의 ID

    // 모달을 닫는 함수
    function closeModal() {
        modal.style.display = 'none';
        currentItemId = null; // ID 리셋
    }

    // 1. 그리드 아이템 클릭 이벤트 리스너 설정
    gridItems.forEach(item => {
        item.addEventListener('click', () => {
            // 클릭된 아이템의 데이터 가져오기
            const id = item.getAttribute('data-id');
            const sentence = item.getAttribute('data-sentence');
            const imageElement = item.querySelector('.placeholder-image');
            const imageSrc = imageElement ? imageElement.src : '';

            // 현재 아이템 ID 저장
            currentItemId = id;

            // 모달에 정보 채우기
            modalImage.src = imageSrc;
            modalSentenceDisplay.textContent = sentence;
            
            // 모달 표시
            modal.style.display = 'block';
        });
    });

    // 2. 닫기 버튼 (X), 모달 외부 클릭 이벤트: 모달 닫기
    closeButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // 3. '좋아요 취소' 버튼 클릭 이벤트: 항목 삭제 (좋아요 취소)
    unlikeButton.addEventListener('click', () => {
        // 사용자에게 좋아요 취소를 확인하는 메시지를 표시합니다.
        // alert() 대신 커스텀 모달 UI를 사용하는 것이 권장됩니다.
        if (confirm(`정말로 이 게시물 (ID: ${currentItemId})의 좋아요를 취소하시겠습니까?`)) {
            
            // 1. UI에서 항목 제거 (좋아요 취소된 게시물은 목록에서 사라져야 하므로)
            const itemToUnlike = document.querySelector(`.grid-item[data-id="${currentItemId}"]`);
            if (itemToUnlike) {
                itemToUnlike.remove();
            }
            
            // 2. 모달 닫기
            closeModal();
            
            // TODO: 실제 서버나 Firestore에서 해당 게시물의 좋아요 상태를 해제하는 로직을 추가해야 합니다.
            console.log(`[ID: ${currentItemId}] 좋아요가 취소되었습니다. (DB 업데이트 필요)`);
        }
    });
});
