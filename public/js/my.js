document.addEventListener('DOMContentLoaded', () => {

    // =========================================================
    // 1. 프로필 정보 수정 폼 (User Account Update) 유효성 검사
    // =========================================================
    const profileForm = document.querySelector('.login-form[action*="/my?_method=PUT"]');

    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            const passwordInput = document.getElementById('password-input');
            const confirmPasswordInput = document.getElementById('confirm-password-input');
            
            // 💡 주의: 현재 EJS 폼에 'current-password-input'이 없습니다. 
            // 서버(`userController.js`)에서 현재 비밀번호 없이 새 비밀번호 필드가 있는 경우를 처리하도록 구현되어 있습니다.
            // 클라이언트에서는 새 비밀번호 일치 여부만 검사합니다.

            const newPassword = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            // 새 비밀번호가 입력되었을 경우에만 검증 로직 실행
            if (newPassword || confirmPassword) {
                
                if (newPassword.length > 0 && newPassword.length < 6) {
                    e.preventDefault();
                    alert("새 비밀번호는 최소 6자 이상이어야 합니다.");
                    passwordInput.focus();
                    return false;
                }

                if (newPassword !== confirmPassword) {
                    e.preventDefault();
                    alert("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
                    confirmPasswordInput.focus();
                    return false;
                }
            }
            
            // 모든 검증 통과
            return true;
        });
    }


    // =========================================================
    // 2. 사용자 게시물 관리 모달 로직 (Post Edit/Delete)
    // =========================================================
    
    // DOM 요소 선택
    const gridItems = document.querySelectorAll('.grid-item');
    const modal = document.getElementById('myPostModal'); // 💡 EJS에서 이 ID를 사용한다고 가정
    const closeButton = modal ? modal.querySelector('.close-button') : null;
    const modalImage = document.getElementById('modal-post-image');
    
    // 텍스트 표시/수정 영역
    const displayWrapper = document.getElementById('modal-text-display-wrapper');
    const editWrapper = document.getElementById('modal-text-edit-wrapper');
    const modalUserText = document.getElementById('modal-user-text');
    const editTextArea = document.getElementById('edit-post-textarea');
    
    // 버튼
    const editButton = document.getElementById('edit-post-button');
    const saveButton = document.getElementById('save-post-button');
    const cancelButton = document.getElementById('cancel-edit-button');
    const deleteButton = document.getElementById('delete-post-button');

    // 현재 모달이 띄워진 게시물의 ID를 저장할 변수
    let currentPostId = null; 

    if (!modal) {
        // console.warn("게시물 모달 요소(ID: myPostModal)를 찾을 수 없습니다. 게시물 관리 기능이 작동하지 않습니다.");
        // 모달이 없으면 나머지 게시물 로직은 실행하지 않음
        return; 
    }


    // --- 2-1. 그리드 항목 클릭: 모달 데이터 로드 및 표시 ---
    gridItems.forEach(item => {
        item.addEventListener('click', () => {
            // 데이터 속성에서 게시물 정보 가져오기 (my.ejs에 data-post-id, data-post-text 필요)
            currentPostId = item.getAttribute('data-post-id');
            const imageSrc = item.querySelector('.placeholder-image').src;
            const postText = item.getAttribute('data-post-text');
            
            if (!currentPostId) {
                alert('게시물 정보를 찾을 수 없습니다.');
                return;
            }

            // 모달에 정보 채우기
            modalImage.src = imageSrc;
            modalUserText.textContent = postText;

            // 모달 초기 상태: 텍스트 표시 모드
            if (displayWrapper && editWrapper) {
                displayWrapper.style.display = 'block';
                editWrapper.style.display = 'none';
            }

            modal.style.display = 'block';
        });
    });

    // --- 2-2. 닫기 버튼 (X) 및 외부 클릭: 모달 닫기 ---
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // --- 2-3. '수정' 버튼 클릭: 수정 모드 활성화 ---
    if (editButton && displayWrapper && editWrapper && editTextArea) {
        editButton.addEventListener('click', () => {
            editTextArea.value = modalUserText.textContent;
            displayWrapper.style.display = 'none';
            editWrapper.style.display = 'block';
        });
    }
    
    // --- 2-4. '수정 취소' 버튼 클릭: 표시 모드 복귀 ---
    if (cancelButton && displayWrapper && editWrapper) {
        cancelButton.addEventListener('click', () => {
            displayWrapper.style.display = 'block';
            editWrapper.style.display = 'none';
        });
    }

    // --- 2-5. '수정 저장' 버튼 클릭: PUT API 호출 ---
    if (saveButton && editTextArea) {
        saveButton.addEventListener('click', async () => {
            if (!currentPostId) return alert('게시물 ID를 찾을 수 없습니다.');
            
            const newText = editTextArea.value.trim();
            if (!newText) {
                return alert('게시물 내용은 비워둘 수 없습니다.');
            }
            
            if (newText === modalUserText.textContent) {
                alert('수정된 내용이 없습니다.');
                displayWrapper.style.display = 'block';
                editWrapper.style.display = 'none';
                return;
            }

            try {
                const response = await fetch(`/posts/${currentPostId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ postText: newText })
                });

                const data = await response.json();

                if (response.ok) {
                    alert('게시물이 성공적으로 수정되었습니다.');
                    
                    // UI 업데이트
                    modalUserText.textContent = data.newText; 
                    const gridItemToUpdate = document.querySelector(`.grid-item[data-post-id="${currentPostId}"]`);
                    if (gridItemToUpdate) {
                        gridItemToUpdate.setAttribute('data-post-text', data.newText);
                        const gridTextElement = gridItemToUpdate.querySelector('.sentence-text');
                        if (gridTextElement) {
                            gridTextElement.textContent = data.newText;
                        }
                    }

                    // 수정 완료 후, 표시 모드로 복귀하고 모달 닫기
                    displayWrapper.style.display = 'block';
                    editWrapper.style.display = 'none';
                    modal.style.display = 'none';

                } else {
                    alert(`수정 실패: ${data.message || '알 수 없는 오류'}`);
                }
            } catch (error) {
                console.error('게시물 수정 중 오류 발생:', error);
                alert('게시물 수정 요청 중 오류가 발생했습니다.');
            }
        });
    }

    // --- 2-6. '삭제' 버튼 클릭: DELETE API 호출 ---
    if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
            if (!currentPostId) return alert('게시물 ID를 찾을 수 없습니다.');
            
            if (!confirm('정말로 이 게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                return;
            }

            try {
                const response = await fetch(`/posts/${currentPostId}`, {
                    method: 'DELETE',
                });

                const data = await response.json();

                if (response.ok) {
                    alert('게시물이 성공적으로 삭제되었습니다.');
                    
                    // UI 업데이트: 그리드 아이템 제거
                    const gridItemToRemove = document.querySelector(`.grid-item[data-post-id="${currentPostId}"]`);
                    if (gridItemToRemove) {
                        gridItemToRemove.remove();
                    }

                    // 모달 닫기
                    modal.style.display = 'none';

                } else {
                    alert(`삭제 실패: ${data.message || '알 수 없는 오류'}`);
                }
            } catch (error) {
                console.error('게시물 삭제 중 오류 발생:', error);
                alert('게시물 삭제 요청 중 오류가 발생했습니다.');
            }
        });
    }
});