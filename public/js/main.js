document.addEventListener('DOMContentLoaded', () => {

    let gridItems = document.querySelectorAll('.grid-item');
    let currentPostId = null; 
    

    let modal = document.getElementById('myModal');
    let closeButton = document.querySelector('.close-button');
    let modalImage = document.getElementById('modal-image');
    let modalUserText = document.getElementById('modal-user-text');
    let likeButton = document.getElementById('like-button'); 

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

    function isValidObjectId(id) {
 
        return id && /^[0-9a-fA-F]{24}$/.test(id);
    }



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

    if (likeButton) {
    likeButton.addEventListener('click', async () => {
        if (!currentPostId || !isValidObjectId(currentPostId)) { 
            alert("유효한 게시물 정보를 찾을 수 없습니다. (정적 게시물은 좋아요를 지원하지 않습니다.)");
            if (modal) { modal.style.display = 'none'; }
            return;
        }
        await toggleLikeStatus(currentPostId, true);
        if (modal) {
            modal.style.display = 'none';
        }
    });
}
    // ---------------------------------------------------


    const unlikeButtons = document.querySelectorAll('.unlike-post');


    if (unlikeButtons.length > 0) {
        unlikeButtons.forEach(button => {
            button.addEventListener('click', async (event) => {
                event.stopPropagation(); 
                const postId = button.getAttribute('data-post-id');
                
                if (confirm("정말 이 게시물의 좋아요를 취소하시겠습니까?")) {
                    await toggleLikeStatus(postId, false); 
                }
            });
        });
    }
    // ---------------------------------------------------


    if (myPostModal && gridItems.length > 0) {

        gridItems.forEach(item => {
            item.addEventListener('click', (event) => {
   
                if (event.target.classList.contains('unlike-post')) return;

                currentMyPostId = item.getAttribute('data-post-id');
                const imageElement = item.querySelector('.placeholder-image');
                const userSentence = item.getAttribute('data-sentence-text');
                

                myModalImage.src = imageElement ? imageElement.src : '';
                myModalUserText.textContent = userSentence || '';
                editTextArea.value = userSentence || ''; 
                
    
                editArea.style.display = 'none';
                editModeButton.style.display = 'block'; 
                deletePostButton.style.display = 'block'; 
                myModalUserText.style.display = 'block'; 

                myPostModal.style.display = 'block';
            });
        });


        editModeButton.addEventListener('click', () => {
            editArea.style.display = 'block';
            editModeButton.style.display = 'none';
            deletePostButton.style.display = 'none'; 
            myModalUserText.style.display = 'none'; 
        });

       
        cancelEditButton.addEventListener('click', () => {
            editArea.style.display = 'none';
            editModeButton.style.display = 'block';
            deletePostButton.style.display = 'block';
            myModalUserText.style.display = 'block';
        });
        
   
        saveEditButton.addEventListener('click', async () => {
            const newText = editTextArea.value.trim();
            if (newText === '') {
                alert('수정할 내용을 입력해주세요.');
                return;
            }
            
     
            if (!currentMyPostId || !isValidObjectId(currentMyPostId)) {
                alert("유효한 게시물 정보를 찾을 수 없어 수정할 수 없습니다.");
                myPostModal.style.display = 'none';
                return;
            }
            const isUpdated = await updatePost(currentMyPostId, newText);
            
            if (isUpdated) {
       
                const postItem = document.querySelector(`.grid-item[data-post-id="${currentMyPostId}"]`);
                if (postItem) {
                    postItem.querySelector('.sentence-text').textContent = newText;
                    postItem.setAttribute('data-sentence-text', newText);
                    myModalUserText.textContent = newText; 
                }
                myPostModal.style.display = 'none';
            }
        });
        
        deletePostButton.addEventListener('click', async () => {
            if (!currentMyPostId || !isValidObjectId(currentMyPostId)) {
                alert("유효한 게시물 정보를 찾을 수 없어 삭제할 수 없습니다.");
                myPostModal.style.display = 'none';
                return;
            }
            
            if (confirm("정말 이 게시물을 삭제하시겠습니까?")) {
                await deletePost(currentMyPostId);
                myPostModal.style.display = 'none';
            }
        });
                
        myPostModal.querySelector('.close-button').addEventListener('click', () => {
            myPostModal.style.display = 'none';
        });
        

        window.addEventListener('click', (event) => {
            if (event.target === myPostModal) {
                myPostModal.style.display = 'none';
            }
        });
    }
    // ---------------------------------------------------

    async function toggleLikeStatus(postId, isFromMainPage) {
        try {
            const response = await fetch(`/like-post/${postId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message); 
                
          
                if (!isFromMainPage && !data.isLiked) {
                    const itemToRemove = document.querySelector(`.grid-item[data-post-id="${postId}"]`);
                    if (itemToRemove) {
                        itemToRemove.remove();
                        
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
            alert("로그인 하신 뒤에 이용 가능합니다.");
        }
    }



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


    async function deletePost(postId) {
        try {
            const response = await fetch(`/posts/${postId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert(data.message);
   
                const itemToRemove = document.querySelector(`.grid-item[data-post-id="${postId}"]`);
                if (itemToRemove) {
                    itemToRemove.remove();
                    
            
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