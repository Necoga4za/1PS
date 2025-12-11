document.addEventListener('DOMContentLoaded', () => {
    // ⭐️ 1. 전역 변수 선언 (모든 페이지에서 사용할 수 있도록 최상단에 선언) ⭐️
    // let을 사용하여 요소가 없으면 null이 되도록 처리합니다.
    let gridItems = document.querySelectorAll('.grid-item');
    let currentPostId = null; 
    
    // 1ps.ejs (메인 페이지) 모달 관련 변수
    let modal = document.getElementById('myModal');
    let closeButton = document.querySelector('.close-button');
    let modalImage = document.getElementById('modal-image');
    let modalUserText = document.getElementById('modal-user-text');
    let likeButton = document.getElementById('like-button'); 

    // my-posts.ejs (내 게시물) 모달 관련 변수
    const myPostModal = document.getElementById('myPostModal');
    const editModeButton = document.getElementById('edit-mode-button');
    const deletePostButton = document.getElementById('delete-post-button');
    const saveEditButton = document.getElementById('save-edit-button');
    const cancelEditButton = document.getElementById('cancel-edit-button');
    const editArea = document.querySelector('.edit-area');
    const editTextArea = document.getElementById('edit-textarea');
    const myModalImage = document.getElementById('my-modal-image');
    const myModalUserText = document.getElementById('my-modal-user-text');
    
    let currentMyPostId = null;


    // --- 1. 1ps.ejs (메인 페이지) 로직: 모달 열기 및 좋아요 ---
    // 💡 gridItems와 모달 요소가 모두 존재할 때만 실행
    if (gridItems.length > 0 && modal && modalImage && modalUserText) {
        gridItems.forEach(item => {
            item.addEventListener('click', () => {
                currentPostId = item.getAttribute('data-post-id'); 
                const imageElement = item.querySelector('.placeholder-image') || item.querySelector('.grid-main-image');
                const imageSrc = imageElement ? imageElement.src : '';
                const userSentence = item.getAttribute('data-sentence-text');
                
                if (imageSrc) {
                    modalImage.src = imageSrc; 
                    modalUserText.textContent = userSentence || ''; 
                }
                modal.style.display = 'block';
            });
        });
    }

    // 💡 1ps.ejs 모달 닫기 이벤트 (TypeError 방지)
    if (closeButton && modal) {
        closeButton.addEventListener('click', () => { 
            modal.style.display = 'none'; 
        });
    }
    if (modal) {
        window.addEventListener('click', (event) => {
            if (event.target === modal) { modal.style.display = 'none'; }
        });
    }
    
    // 💡 1ps.ejs 모달의 '좋아요' 버튼 클릭 이벤트 (TypeError 방지)
    if (likeButton) {
        likeButton.addEventListener('click', async () => {
            if (!currentPostId) {
                alert("게시물 정보를 찾을 수 없습니다.");
                return;
            }
            await toggleLikeStatus(currentPostId, true); // isFromMainPage: true
            if (modal) {
                modal.style.display = 'none';
            }
        });
    }
    // ---------------------------------------------------


    // --- 2. likes.ejs (좋아요 취소) 로직 ---
    const unlikeButtons = document.querySelectorAll('.unlike-post');

    // '💔 좋아요 취소' 버튼 클릭 이벤트
    if (unlikeButtons.length > 0) {
        unlikeButtons.forEach(button => {
            button.addEventListener('click', async (event) => {
                event.stopPropagation(); 
                const postId = button.getAttribute('data-post-id');
                
                if (confirm("정말 이 게시물의 좋아요를 취소하시겠습니까?")) {
                    await toggleLikeStatus(postId, false); // isFromMainPage: false
                }
            });
        });
    }
    // ---------------------------------------------------


    // --- ⭐️ 3. my-posts.ejs (수정/삭제) 로직 ⭐️ ---
    
    // 'My Posts' 페이지에서만 실행 (myPostModal이 존재하고, gridItems도 존재할 때)
    if (myPostModal && gridItems.length > 0) {
        
        // 모달을 열 때 (grid-item 클릭)
        gridItems.forEach(item => {
            item.addEventListener('click', (event) => {
                // 좋아요 취소 버튼 클릭은 무시 (likes.ejs와 혼용될 경우를 대비)
                if (event.target.classList.contains('unlike-post')) return;

                currentMyPostId = item.getAttribute('data-post-id');
                const imageElement = item.querySelector('.placeholder-image');
                const userSentence = item.getAttribute('data-sentence-text');
                
                // 모달 내용 설정
                myModalImage.src = imageElement ? imageElement.src : '';
                myModalUserText.textContent = userSentence || '';
                editTextArea.value = userSentence || ''; // 수정 필드에 현재 텍스트 로드
                
                // 초기 상태: 수정 폼 숨기기, 액션 버튼 보이기
                editArea.style.display = 'none';
                editModeButton.style.display = 'block'; 
                deletePostButton.style.display = 'block'; 
                myModalUserText.style.display = 'block'; 

                myPostModal.style.display = 'block';
            });
        });

        // '수정하기' 버튼 클릭 시
        editModeButton.addEventListener('click', () => {
            editArea.style.display = 'block';
            editModeButton.style.display = 'none';
            deletePostButton.style.display = 'none'; 
            myModalUserText.style.display = 'none'; // 기존 텍스트 숨기기
        });

        // '수정 취소' 버튼 클릭 시
        cancelEditButton.addEventListener('click', () => {
            editArea.style.display = 'none';
            editModeButton.style.display = 'block';
            deletePostButton.style.display = 'block';
            myModalUserText.style.display = 'block'; // 기존 텍스트 다시 보이기
        });
        
        // '수정 저장' 버튼 클릭 시
        saveEditButton.addEventListener('click', async () => {
            const newText = editTextArea.value.trim();
            if (newText === '') {
                alert('수정할 내용을 입력해주세요.');
                return;
            }

            const isUpdated = await updatePost(currentMyPostId, newText);
            
            if (isUpdated) {
                // 성공 시 DOM 업데이트 및 모달 닫기
                const postItem = document.querySelector(`.grid-item[data-post-id="${currentMyPostId}"]`);
                if (postItem) {
                    postItem.querySelector('.sentence-text').textContent = newText;
                    postItem.setAttribute('data-sentence-text', newText);
                    myModalUserText.textContent = newText; 
                }
                myPostModal.style.display = 'none';
            }
        });
        
        // '삭제하기' 버튼 클릭 시
        deletePostButton.addEventListener('click', async () => {
            if (confirm("정말 이 게시물을 삭제하시겠습니까?")) {
                await deletePost(currentMyPostId);
                myPostModal.style.display = 'none';
            }
        });
        
        // 모달 닫기 (X 버튼)
        myPostModal.querySelector('.close-button').addEventListener('click', () => {
            myPostModal.style.display = 'none';
        });
        
        // 모달 닫기 (배경 클릭)
        window.addEventListener('click', (event) => {
            if (event.target === myPostModal) {
                myPostModal.style.display = 'none';
            }
        });
    }
    // ---------------------------------------------------


    // --- 4. 공통 API 헬퍼 함수 ---

    // 💡 좋아요/좋아요 취소 요청을 처리하는 공통 함수
    async function toggleLikeStatus(postId, isFromMainPage) {
        try {
            const response = await fetch(`/like-post/${postId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message); 
                
                // likes.ejs 페이지에서 취소 성공 시, 해당 게시물을 목록에서 제거
                if (!isFromMainPage && !data.isLiked) {
                    const itemToRemove = document.querySelector(`.grid-item[data-post-id="${postId}"]`);
                    if (itemToRemove) {
                        itemToRemove.remove();
                        // 목록이 비었는지 확인 및 메시지 표시
                        if (document.querySelectorAll('.grid-item').length === 0) {
                            const gridContainer = document.querySelector('.grid-container');
                            if (gridContainer) {
                                gridContainer.innerHTML = '<p style="text-align: center; width: 100%;">좋아요를 누른 게시물이 아직 없습니다.</p>';
                            }
                        }
                    }
                }
            } else {
                alert(`오류: ${data.message || '요청 처리에 실패했습니다.'}`);
                if (response.status === 401) {
                    window.location.href = '/login'; 
                }
            }
        } catch (error) {
            console.error('좋아요 요청 중 오류 발생:', error);
            alert("서버와 통신하는 중 문제가 발생했습니다.");
        }
    }


    // 💡 게시물 수정 API 호출 함수
    async function updatePost(postId, newText) {
        try {
            const response = await fetch(`/posts/${postId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postText: newText })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert(data.message);
                return true;
            } else {
                alert(`수정 실패: ${data.message || '요청 처리에 실패했습니다.'}`);
                if (response.status === 403) {
                    window.location.href = '/login'; 
                }
                return false;
            }
        } catch (error) {
            console.error('게시물 수정 중 오류 발생:', error);
            alert("서버와 통신하는 중 문제가 발생했습니다.");
            return false;
        }
    }

    // 💡 게시물 삭제 API 호출 함수
    async function deletePost(postId) {
        try {
            const response = await fetch(`/posts/${postId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert(data.message);
                // 성공 시 DOM에서 게시물 제거
                const itemToRemove = document.querySelector(`.grid-item[data-post-id="${postId}"]`);
                if (itemToRemove) {
                    itemToRemove.remove();
                    
                    // 목록이 비었는지 확인 및 메시지 표시
                    if (document.querySelectorAll('.grid-item').length === 0) {
                        const gridContainer = document.querySelector('.grid-container');
                        if (gridContainer) {
                            gridContainer.innerHTML = '<p style="text-align: center; width: 100%;">아직 업로드한 게시물이 없습니다. 당신의 P.S.를 공유해보세요!</p>';
                        }
                    }
                }
            } else {
                alert(`삭제 실패: ${data.message || '요청 처리에 실패했습니다.'}`);
                if (response.status === 403) {
                    window.location.href = '/login'; 
                }
            }
        } catch (error) {
            console.error('게시물 삭제 중 오류 발생:', error);
            alert("서버와 통신하는 중 문제가 발생했습니다.");
        }
    }
});