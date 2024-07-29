

var apiKey = "";
var threadId = "";
var lastMessage = "";
var elevenApiKey = '';
var heygenApiKey = "";

var assistantId= "asst_vsqugc622KXhJ08mscEkpct8";	// chat gpt assistantId
var elevenVoiceId= 'isHvq7WnwQY2e8dQDwGR';			// eleven 대표님 목소리
var heygenTalkingPhotoId= "53ecb76ecf68417388ff20875d18ae2f";	// heygen 에 등록되어있는 대표님 아바타id
var heygenElevenVoiceId= "df393bed984b4a0a84466386b5ff8052";		// heygen 에서 eleven id 가져오기
var heygenVideoId= "0c7ce2f133ba412887b0586685fd160e";			// 미리 만들어 놓은 영상


let fileIds;

let sendMessages ="";

$(document).ready(function() {
    alert('api key 입력해주세요');
    /*const keyFileUrl = 'https://bgko1107.github.io/nice_ai_competition/key';

    $.get(keyFileUrl, function(data) {
        // Parse the content
        const lines = data.split('\n');
        const config = {};

        lines.forEach(line => {
            if (line.trim()) {
                const [key, value] = line.split('=').map(part => part.trim().replace(/['";]+/g, ''));
                config[key] = value;
            }
        });

        assistantId = config.assistantId;
        elevenVoiceId = config.elevenVoiceId;
        heygenVideoId = config.heygenVideoId;
        heygenTalkingPhotoId = config.heygenTalkingPhotoId;
        heygenElevenVoiceId = config.heygenElevenVoiceId;

        // 스레드 생성
        // createThread();


    }).fail(function() {
        alert('Failed to load the file.');
    });*/

    $("#api_key_btn").on('click', function (){
        if($("#api_key").val().length > 0){
            apiKey = $("#api_key").val();
            elevenApiKey = $("#eleven_key").val();
            heygenApiKey = $("#heygen_key").val();

            $("#api_key").remove();
            $("#eleven_key").remove();
            $("#heygen_key").remove();
            $("#api_key_btn").remove();

            // $("#key").css("margin-top","48px");
            createThread();
        }else{
            alert('api key 를 입력해주세요.');
        }
    });


    $('#message-input').keypress(function(event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    $('#send').click(function() {
        sendMessage();
    });

    $('#speakBtn').click(function() {
        speakText();
    });

    $('#file-input').change(function() {
        displayFileNames();
    });

    $('#toggle-theme').click(function() {
        $('body').toggleClass('dark-mode light-mode');

        if($('body').hasClass("dark-mode")){
            $("#toggle-theme").text("라이트모드");
            $("#toggle-theme").css("background-color","#ffffff");
            $("#toggle-theme").css("color","#2c3e50");
        }else{
            $("#toggle-theme").text("다크모드");
            $("#toggle-theme").css("background-color","#2c3e50");
            $("#toggle-theme").css("color","#ffffff");
        }
    });

    // 영상으로 재생
    $("#play-video").on('click', function (){
        // 음성 종료
        $('.audio-output').each(function() {
            this.pause();
            this.currentTime = 0;
        });

        // 대화창 초기화
        $('.left-messages-wrapper').html('<div class="typing-indicator-text" style="display:none;"></div>');

        // 로딩바
        $("#loading-spinner").show();
        $("#modal-overlay").show();
        // 영상
        // generateVideo();

        $(this).hide();
        getVideo();

    });
});

// 파일 이름 표시 함수
function displayFileNames() {
    const fileInput = $('#file-input')[0];
    const fileNamesDiv = $('#file-names');
    fileNamesDiv.empty();

    if (fileInput.files.length > 0) {
        for (let i = 0; i < fileInput.files.length; i++) {
            const file = fileInput.files[i];
            const fileNameElement = $('<div></div>').addClass('file-name').attr('data-index', i).html(`<span>${file.name}</span> <span class="remove-file">x</span>`);
            fileNamesDiv.append(fileNameElement);
        }
        fileNamesDiv.show();

        $('.remove-file').click(function() {
            const index = $(this).parent().data('index');
            removeFile(index);
        });
    } else {
        fileNamesDiv.hide();
    }
}

// 파일 제거 함수
function removeFile(index) {
    const fileInput = $('#file-input')[0];
    const dataTransfer = new DataTransfer();

    for (let i = 0; i < fileInput.files.length; i++) {
        if (i !== index) {
            dataTransfer.items.add(fileInput.files[i]);
        }
    }

    fileInput.files = dataTransfer.files;
    displayFileNames();
}

// 모든 파일 제거 함수
function removeAllFiles() {
    const fileInput = $('#file-input')[0];
    const dataTransfer = new DataTransfer();
    fileInput.files = dataTransfer.files; // 빈 파일 리스트를 설정하여 모든 파일 제거
    displayFileNames();
}

// 보내기 버튼
function sendMessage() {
    const input = $('#message-input');
    const fileInput = $('#file-input')[0];
    sendMessages = input.val();
    $('#message-input').val("");
    if (sendMessages.trim() !== '' || fileInput.files.length > 0) {
        addMessage(sendMessages, 'sent');
        input.val('');
        input.focus();
        addTypingIndicator();

        if (fileInput.files.length > 0) {
            // 파일 첨부
            sendMessageWithFiles(fileInput.files, sendMessages);
        } else {
            // 파일 첨부 x
            sendMessageToThread(sendMessages);
        }
    }

    removeAllFiles();
}

// 대화 입력중 모양 표시
function addTypingIndicator() {
    const typingIndicator = $('<div></div>').addClass('message received typing-indicator').html('<span></span><span></span><span></span>');
    $('.right-messages-wrapper').append(typingIndicator);
    $('.right-messages-wrapper').scrollTop($('.right-messages-wrapper')[0].scrollHeight);

    $('.left-messages-wrapper').html(typingIndicator);
    $('.left-messages-wrapper').append('<div class="typing-indicator-text" style="display:none;"></div>');
}

// 대화 입력중 모양 제거
function removeTypingIndicator() {
    $('.typing-indicator').remove();
}

// 스레드 생성
function createThread() {
    $.ajax({
        url: "https://api.openai.com/v1/threads",
        type: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + apiKey,
            "OpenAI-Beta": "assistants=v2"
        },
        data: '{}',
        success: function(response) {
            threadId = response.id;
        },
        error: function(xhr, status, error) {
            console.error("Error creating thread:", error);
        }
    });
}

// 메시지 스레드로 전송
function sendMessageToThread(message) {
    var url = "https://api.openai.com/v1/threads/" + threadId + "/messages";
    $.ajax({
        url: url,
        type: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + apiKey,
            "OpenAI-Beta": "assistants=v2"
        },
        data: JSON.stringify({
            "role": "user",
            "content": message,
        }),
        success: function(response) {
            createRun();
        },
        error: function(xhr, status, error) {
            console.error("Error sending message:", error);
        }
    });
}

// 첨부파일 업로드
async function uploadFiles(files) {
    const uploadedFiles = [];
    for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('purpose', 'fine-tune');  // purpose 확인

        const response = await fetch('https://api.openai.com/v1/files', {
            method: 'POST',
            headers: {
                "Authorization": "Bearer " + apiKey,
            },
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            uploadedFiles.push(result.id);
        } else {
            console.error('Error uploading file:', response.statusText);
        }
    }
    return uploadedFiles;
}

// 업로드된 첨부파일 스레드로 메시지랑 같이 전송
async function sendMessageWithFiles(files, message) {
    fileIds = await uploadFiles(files);

    var url = "https://api.openai.com/v1/threads/" + threadId + "/messages";
    var content = message + "\n\nAttached Files:\n" + fileIds.map(id => `file-${id}`).join('\n');

    $.ajax({
        url: url,
        type: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + apiKey,
            "OpenAI-Beta": "assistants=v2"
        },
        data: JSON.stringify({
            "role": "user",
            "content": content,
            "attachments": fileIds.map(id => ({
                "file_id": id,
                "tools": [{ "type": "file_search" }] // 'file_search'로 변경
            }))
        }),
        success: function(response) {
            createRun();
        },
        error: function(xhr, status, error) {
            console.error("Error sending message with files:", xhr.responseText, status, error);
        }
    });
}

// 스레드 실행 (메시지 실행)
function createRun() {
    var url = "https://api.openai.com/v1/threads/" + threadId + "/runs";
    $.ajax({
        url: url,
        type: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey,
            'OpenAI-Beta': 'assistants=v2'
        },
        data: JSON.stringify({
            assistant_id: assistantId
        }),
        success: function(runResponse) {
            checkRunStatus(runResponse.id);
        },
        error: function(xhr, status, error) {
            console.error("Error creating run:", error);
        }
    });
}

// 스레드 실행가능한지 확인
function checkRunStatus(runId) {
    var url = "https://api.openai.com/v1/threads/" + threadId + "/runs/" + runId;
    setTimeout(function() {
        $.ajax({
            url: url,
            type: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey,
                'OpenAI-Beta': 'assistants=v2'
            },
            success: function(runResponse) {
                if (runResponse.status === "completed") {
                    messageList();
                } else {
                    checkRunStatus(runId);
                }
            },
            error: function(xhr, status, error) {
                console.error("Error checking run status:", error);
            }
        });
    }, 3000);
}

// 메시지 목록 가져오기
function messageList() {
    var url = "https://api.openai.com/v1/threads/" + threadId + "/messages";
    $.ajax({
        url: url,
        type: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey,
            'OpenAI-Beta': 'assistants=v2'
        },
        success: function(response) {
            // 마지막 메시지만 출력(전체 메시지 내용이 다 있음)
            var message = response.data[0];
            if (message.role === "assistant") {
                if (message.content[0].type === "text") {
                    lastMessage = message.content[0].text.value.replaceAll("*","");
                    speakText();
                }
            }
        },
        error: function(xhr, status, error) {
            console.error("Error fetching messages:", error);
        }
    });
}

// 엔터 테그로 변경 ( 내용 보기 예쁘게 하기 위함 )
function replaceTag(text){
    text = text.replace(/\r\n/g, '<br/>');
    text = text.replace(/\n/g, '<br/>');
    text = text.replace(/\t/g, ' ');
    return text;
}

// 받아온 메시지 출력 (text)
function addMessage(text, type) {

    let message = replaceTag(text);
    let messageElement = "";
    if(type=="received"){
        messageElement = $('<div style="display: none;"></div>').addClass('message').addClass(type).addClass(type + "_"+$(".message.received").length).html(message);

        const messagesWrapper = document.querySelector(".left-messages-wrapper");
        const typingIndicator = document.querySelector(".typing-indicator-text");

        const messageElement_typing = document.createElement('div');
        messageElement_typing.classList.add('message', type);
        messageElement_typing.innerHTML = ''; // Initialize with an empty string

        messagesWrapper.appendChild(messageElement_typing);
        $(".left-messages-wrapper").children(".received").css("max-width", "100%");
        typeText(messageElement_typing, text, typingIndicator, function() {
        });
    }else{
        messageElement = $('<div></div>').addClass('message').addClass(type).html(message);
    }
    $('.right-messages-wrapper').append(messageElement);
    $('.right-messages-wrapper').scrollTop($('.right-messages-wrapper')[0].scrollHeight);

    if($("#toggle-conversation").text() != "대화 내용 보기"){
        $(".right-container").find(".message.received").each(function (){
            if(!$(this).hasClass("typing-indicator")){
                $(this).show();
            }
        });
    }else{
        $(".right-container").find(".message.received").each(function (){
            if(!$(this).hasClass("typing-indicator")){
                $(this).hide();
            }
        });
    }
}

// 음성 출력 api(음성)
function speakText() {

    var text = lastMessage;

    var payload = {
        text: text,
        model_id : "eleven_multilingual_v2",
        speed: 1.0,  // 말하는 속도 조절
        volume: 1.0, // 음량 조절
        pitch: 1.0   // 음높이 조절
    };

    $.ajax({
        url: 'https://api.elevenlabs.io/v1/text-to-speech/' + elevenVoiceId,
        method: 'POST',
        headers: {
            'xi-api-key': elevenApiKey,
            'Content-Type': 'application/json'
        },
        data: JSON.stringify(payload),
        xhrFields: {
            responseType: 'blob' // Blob 형태로 응답 받기
        },
        success: function(response) {
            // 실행 중인 오디오 요소 정지
            $('.audio-output').each(function() {
                this.pause();
                this.currentTime = 0;
            });

            var audioURL = URL.createObjectURL(response);
            var length = $('.audio-output.received').length;
            var html = '<audio class="audio-output received audio_' + length + '" controls autoplay></audio>';
            $('.right-messages-wrapper').append(html);
            $('.right-messages-wrapper').scrollTop($('.right-messages-wrapper')[0].scrollHeight);
            $('.audio-output.received.audio_' + length).attr('src', audioURL);
            $('.audio-output').hide();

            removeTypingIndicator(); // 타이핑 인디케이터 제거
            addMessage(lastMessage, 'received');
            // $(".message.received").css("width", "").css("max-width", "70%").css("height", "").css("min-height", "").css("overflow-y", "");

        },
        error: function(xhr, status, error) {
            console.error('Error:', error);
        }
    });
}

// 아바타 목록을 가져오기 위한 함수 예시
function fetchAvatars() {
    $.ajax({
        url: 'https://api.heygen.com/v2/avatars',
        method: 'GET',
        headers: {
            accept: 'application/json',
            'x-api-key': heygenApiKey
        },
        success: function(response) {
            console.log('Available Avatars:', response);
            // 여기서 유효한 아바타 ID를 선택하거나, response에서 필요한 데이터를 활용합니다.
        },
        error: function(err) {
            console.error('Error fetching avatars:', err);
        }
    });
}

// 영상 생성 (video)
function generateVideo() {
    var text = lastMessage;

    const options = {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'x-api-key': heygenApiKey
        },
        body: JSON.stringify({
            test: true,
            caption: false,
            title: '대표님 답변',
            callback_id: 'callback123',
            dimension: { width: 1920, height: 1080 },
            video_inputs: [
                {
                    character: {
                        type: 'talking_photo',
                        talking_photo_id: heygenTalkingPhotoId,
                        scale: 1,
                        talking_photo_style: 'square',
                        talking_style: 'stable', // Default value
                        expression: 'default', // Default value
                        offset: { x: 0, y: 0 }
                    },
                    voice: {
                        type: 'text',
                        voice_id: heygenElevenVoiceId,
                        input_text: text,
                        speed: 1.0,
                        pitch: 0,
                        emotion: 'Friendly'
                    },
                    background: {
                        type: 'color',
                        value: '#f6f6fc'
                    }
                }
            ],
            remove_watermark: true // 워터마크 제거 옵션
        })
    };

    $.ajax({
        url: 'https://api.heygen.com/v2/video/generate',
        method: options.method,
        headers: options.headers,
        data: options.body,
        dataType: 'json',

        success: function(response) {
            if (response.data.video_id) {
                // 새로 만든 videoId
                heygenVideoId = response.data.video_id;
                checkVideoStatus(heygenVideoId);
            } else {
                alert('Video generation failed.');
            }
        },
        error: function(err) {
            console.error('Error:', err);
        }
    });
}

function checkVideoStatus(videoId) {
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            'x-api-key': heygenApiKey
        }
    };

    const checkStatus = async () => {
        try {
            const response = await $.ajax({
                url: 'https://api.heygen.com/v1/video_status.get?video_id=' + videoId,
                method: options.method,
                headers: options.headers
            });

            if (response.code === 100 && response.data.status === 'completed') {
                showGeneratedVideo(response.data.video_url);
            } else {
                console.log('Video generation is not completed yet. Checking again in 10 seconds...');
                setTimeout(checkStatus, 10000); // Check again in 10 seconds
            }
        } catch (err) {
            console.error('Error checking video status:', err);
        }
    };

    checkStatus(); // Start the initial check
}

// 영상 정보 가져오기
function getVideo() {
    // 임시로 만들어져 있는거 가져오기 ( 원래는 삭제 )
    // 81dc4a5c2ffe4e9e8a39cacc2f74fc3c 2m55s
    // e21d20332d224bfe8aa4cc67671d94d7 24s

    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            'x-api-key': heygenApiKey
        }
    };

    $.ajax({
        url: 'https://api.heygen.com/v1/video_status.get?video_id=' + heygenVideoId,
        method: options.method,
        headers: options.headers,
        success: function(response) {
            if (response.code === 100 && response.data.status === 'completed') {
                showGeneratedVideo(response.data.video_url);
            } else {
                alert('Video generation is not completed yet.');
            }
        },
        error: function(err) {
            console.error(err);
        }
    });
}

// 메시지 창에 영상 출력
function showGeneratedVideo(videoUrl) {
    $('.generated-video').each(function() {
        this.pause();
        this.currentTime = 0;
    });


    $("#loading-spinner").hide();
    $("#modal-overlay").hide();

    var length = $('.generated-video').length;
    var html = '<video class="generated-video received_' + length + '" style="width: 136px;height: 191px;" controls autoPlay></video>';

    $('#ceo_video').html(html);
    $('#ceo_video').show()
    $('.right-messages-wrapper').scrollTop($('.right-messages-wrapper')[0].scrollHeight);
    var videoElement = $('.generated-video.received_' + length).get(0);

    videoElement.src = videoUrl;
    videoElement.addEventListener('ended', function() {
        $('#ceo_video').hide();
        $("#play-video").show();
    });
}


document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('toggle-conversation');

    toggleButton.addEventListener('click', () => {
        if (toggleButton.textContent == "대화 내용 보기") {
            $(".right-container").find(".message.received").each(function (){
                if(!$(this).hasClass("typing-indicator")){
                    $(this).show();
                }
            });
            toggleButton.textContent = '대화 내용 숨기기';
        } else {
            $(".right-container").find(".message.received").each(function (){
                if(!$(this).hasClass("typing-indicator")){
                    $(this).hide();
                }
            });
            toggleButton.textContent = '대화 내용 보기';
        }
    });
});

function typeText(element, text, typingIndicator, callback) {
    let index = 0;
    text = text.trim();
    element.innerHTML = '';

    function type() {
        if (index < text.length) {
            element.innerHTML += text.charAt(index);
            index++;
            setTimeout(type, 50);

            const messagesWrapper = document.querySelector(".left-messages-wrapper");
            messagesWrapper.scrollTop = messagesWrapper.scrollHeight; // Scroll to bottom
        } else {
            typingIndicator.style.display = 'none';
            if (callback) callback();
        }
    }

    typingIndicator.style.display = 'flex';
    type();
}
