$(document).ready(function() {

    $(`[id^="img"]`).off().click(function() {
        const id = $(this).attr('data-feed-id');
        const size = Number($(this).attr('data-photo-cnt'));
        let idx = Number($(this).attr('data-photo-index'));

        let img = '';

        for(let i = 0; i < size; i++) {
            const src = $(`#mySwiper${id} img[data-photo-index='${idx}']`).attr('src');
            img += `
                <div class="swiper-slide modal-swiper-slide">
                    <img src="${src}" alt="">
                </div>
            `
            idx = idx + 1 >= size ? 0 : idx + 1;
        }

        $(`.modalImg${id}`).append(`
            <div class="modal">
                <span id="closeModal">&times;</span>
                <div class="modal-content">
                    <div class="swiper modal-swiper modalSwiper">
                        <div class="swiper-wrapper">
                          ${img}
                        </div>
                    </div>
                    <div class="swiper-button-next modalNext"></div>
                    <div class="swiper-button-prev modalPrev"></div>
                </div>
            </div>
        `);
        addCloseModal();
        initSwiper();
    });

    $(`[id^='input_comment']`).keyup(function(e) {
        if(e.key === "Enter") {
            const feedId = this.id.slice('input_comment'.length);
            $(`#btn_comment${feedId}`).trigger('click');
        }
    })

    $(`[id^='btn_comment']`).click(function() {
        sendComment(this);
    })

    ;(function() {
        $(`[id^='cmtBtn']`).each(function() {
            loadCommentByFeedId(this.id.slice('cmtBtn'.length));
        })
    })();

    $(`[id^='more']`).click(function () {
        console.log(this);
        const feedId = this.id.slice('more'.length);
        const content = $(`.feedText${feedId}`);

        let data;

        if (content.text().length > 100) {
            data = {
                isShort: true,  //짧은거 주셈
                feedId: feedId
            }
        } else {
            data = {
                isShort: false,  //긴거 주셈
                feedId: feedId
            }
        }

        $.ajax({
            type: "POST",
            url: "/community/shortContent",
            data: JSON.stringify(data),
            contentType: "application/json; charset=utf-8",
        }).done(response => {
            content.text(response);
            $(this).children(':first-child').text(data['isShort'] ? 'more...' : 'less...')
        })
    })
})

function sendComment(obj) {
    const feedId = obj.id.slice('btn_comment'.length);

    let data;
    if(!$(`#isReply${feedId}`).hasClass('visually-hidden')) { // 댓글
        data = {
            "feedId": feedId,
            "content": $(obj).siblings('input').val(),
            "userId": logged_id,
            "parentId": $(`#isReply${feedId}`).attr('data-parent-id')
        }
    } else {
        data = {
            "feedId": feedId,
            "content": $(obj).siblings('input').val(),
            "userId": logged_id,
        }
    }

    $.ajax({
        url: "/comment/write",
        type: "POST",
        cache: false,
        data: data,
        success: function (data, status) {
            if(status === 'success') {
                if (data.status !== 'OK') {
                    console.log(data.status);
                    return ;
                }
                $(`#input_comment${feedId}`).val('');
                loadCommentByFeedId(feedId);
            }
        }
    })
}

function loadCommentByFeedId(feedId) {
    $.ajax({
        url: "/comment/list?feedId=" + feedId + "&userId=" + logged_id,
        type: "GET",
        cache: false,
        success: function (data, status) {
            if (status === "success") {
                if (data.status !== "OK") {
                    console.log(data.status);
                    return;
                }
                buildComment(data, feedId);
                addDelete(feedId);
                addReply(feedId);
            }
        }
    })
}

function buildComment(result, feedId) {
    $(`#cmt_cnt${feedId}`).text(result.count !== '0' ? result.count : 0);

    const out = [];

    result.data.forEach(comment => {
        let commentId = comment.commentId;
        let content = comment.commentContent.trim();
        let regdate = comment.regDate;

        let user_id = comment.user.id;
        let nickname = comment.user.name;

        // 삭제버튼 여부: 작성자 본인인 경우만 삭제 버튼 보이게 하기
        // 일단 user1
        const delBtn = (user_id !== logged_id) ? '' : `
            <span  data-cmtdel-id="${commentId}">
                <i class="btn fa-solid fa-delete-left text-danger" data-bs-toggle="tooltip"
                               title="삭제"></i>
            </span>
        `;

        // 대댓글 여부
        const replyBtn = (logged_id === 0) ? '' : `
            <span sec:authorize="isAuthenticated()" class="cursor-pointer text-info" data-parent-id="${commentId}" data-reply-nickname="${nickname}" data-reply-content="${content}">
                답급달기
            </span>
        `

        let row;

        row = `
            <div class="mb-1">
                <span style="font-size: 0.9em""><strong>${nickname}</strong>  <small>${regdate}</small>  <small>${replyBtn}</small>   ${delBtn}</span>
                <br>
                <span style="font-size: 0.8em">${content}</span>
            </div>
        `
        out.push(row);
        out.push(...buildReply(comment.replyList));
    });

    $(`#commentBody${feedId}`).html(out.join("\n"));
}

function buildReply(replyList) {
    const out = [];
    replyList.forEach(reply => {
        let replyId = reply.commentId;
        let content = reply.commentContent.trim();
        let regdate = reply.regDate;

        let user_id = reply.user.id;
        let nickname = reply.user.name;

        // 삭제버튼 여부: 작성자 본인인 경우만 삭제 버튼 보이게 하기
        // 일단 user1
        const delBtn = (user_id !== logged_id) ? '' : `
            <span data-cmtdel-id="${replyId}">
                <i class="btn fa-solid fa-delete-left text-danger" data-bs-toggle="tooltip"
                               title="삭제"></i>
            </span>
        `;

        let row = `
            <div class="ms-4 mb-1">
                <span style="font-size: 0.9em""><strong>${nickname}</strong>  <small>${regdate}</small>${delBtn}</span>
                <br>
                <span style="font-size: 0.8em">${content}</span>
            </div>
        `;

        out.push(row);
    })
    return out;
}

function addDelete(feedId) {
    $("[data-cmtdel-id]").click(function(e) {
        e.preventDefault();
        if(!confirm("댓글을 삭제하시겠습니까?")) return;

        const commentId = $(this).attr("data-cmtdel-id");

        $.ajax({
            url: "/comment/delete",
            type: "POST",
            cache: false,
            data: {"commentId" : commentId},
            success: function(data, status) {
                if(status === "success") {
                    if(data.status !== "OK") {
                        console.log(data.status);
                        return ;
                    }
                    loadCommentByFeedId(feedId);
                }
            }
        })
    })
}

function addReply(feedId) {
    $('[data-reply-nickname]').click(function() {
        const nickname = $(this).attr('data-reply-nickname');
        let content = $(this).attr('data-reply-content');

        content = content.length > 10 ? content.split(10) + '...' : content;

        const $isReply = $(`#isReply${feedId}`);
        $isReply.removeClass('visually-hidden');
        $isReply.find('.col-11').text(`${nickname} : ${content} 에 대한 답글을 작성 중...`)
        $isReply.attr('data-parent-id', $(this).attr('data-parent-id'));
        $(`#input_comment${feedId}`).attr('placeholder', '답글을 입력하시오.');
        $(`#input_comment${feedId}`).focus();
    })

    $(`[id^='cancelReply']`).click(function() {
        $(this).parent('div').addClass('visually-hidden');
        $(`#input_comment${feedId}`).attr('placeholder', '댓글을 입력하시오.');
        $(`#input_comment${feedId}`).focus();
    })
}

function addCloseModal() {
    $(`#closeModal`).click(function() {
        $(this).parent().remove();
    })
}

function initSwiper() {
    var swiper = new Swiper(".modalSwiper", {
        slidesPerView: 1,
        spaceBetween: 30,
        loop: true,
        navigation: {
            nextEl: ".modalNext",
            prevEl: ".modalPrev",
        },
    });
}