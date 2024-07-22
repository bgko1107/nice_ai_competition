

var apiKey = "sk-proj-VXzXXzyJ0yzazCLfzGqjT3BlbkFJuUk53sNPA3xyCvjGSoRs";
var assistantId = "asst_cWYyi37N1hY4MBo9rl1dmd0e";
var threadId = "";
var lastMessage = "";
var elevenApiKey = 'sk_24da0da1c487719c1a6002693933baa38fc43e900fc25456';
var elevenVoiceId = 'isHvq7WnwQY2e8dQDwGR';
var heygenApiKey = "ZGQwMjQwOWJlYzA5NDk1MTkwNmU0YzQwZjM5Y2Y5N2UtMTcyMTI3ODg0OA==";
var heygenVideoId = "";
let fileIds;

$(document).ready(function() {
	// 스레드 생성
	createThread();

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
	const message = input.val();
	if (message.trim() !== '' || fileInput.files.length > 0) {
		addMessage(message, 'sent');
		input.val('');
		input.focus();
		addTypingIndicator();

		if (fileInput.files.length > 0) {
			// 파일 첨부
			sendMessageWithFiles(fileInput.files, message);
		} else {
			// 파일 첨부 x
			sendMessageToThread(message);
		}
	}

	removeAllFiles();
}

// 대화 입력중 모양 표시
function addTypingIndicator() {
	const typingIndicator = $('<div></div>').addClass('message received typing-indicator').html('<span></span><span></span><span></span>');
	$('.messages-wrapper').append(typingIndicator);
	$('.messages-wrapper').scrollTop($('.messages-wrapper')[0].scrollHeight);
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
					console.log(message.content[0].text.value);
					lastMessage = message.content[0].text.value;
					removeTypingIndicator();
					addMessage(message.content[0].text.value, 'received');
					speakText();
					generateVideo();
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
	var html = replaceTag(text);
	const messageElement = $('<div></div>').addClass('message').addClass(type).html(html);
	$('.messages-wrapper').append(messageElement);
	$('.messages-wrapper').scrollTop($('.messages-wrapper')[0].scrollHeight);
}


// 음성 출력 api(음성)
function speakText() {

	addTypingIndicator(); // 타이핑 인디케이터 추가

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
			$('.messages-wrapper').append(html);
			$('.messages-wrapper').scrollTop($('.messages-wrapper')[0].scrollHeight);
			$('.audio-output.received.audio_' + length).attr('src', audioURL);

			removeTypingIndicator(); // 타이핑 인디케이터 제거
		},
		error: function(xhr, status, error) {
			console.error('Error:', error);
		}
	});
}

// 아바타 목록을 가져오기 위한 함수 예시
/*function fetchAvatars() {
	$.ajax({
		url: 'https://api.heygen.com/v2/avatars',
		method: 'GET',
		headers: {
			accept: 'application/json',
			'x-api-key': 'ZGQwMjQwOWJlYzA5NDk1MTkwNmU0YzQwZjM5Y2Y5N2UtMTcyMTI3ODg0OA=='
		},
		success: function(response) {
			console.log('Available Avatars:', response);
			// 여기서 유효한 아바타 ID를 선택하거나, response에서 필요한 데이터를 활용합니다.
		},
		error: function(err) {
			console.error('Error fetching avatars:', err);
		}
	});
}*/

// 영상 생성 (video)
function generateVideo() {
	addTypingIndicator(); // 타이핑 인디케이터 추가
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
						talking_photo_id: 'e94e3a6f3cb34a94b9272057f01e71d4',
						scale: 1,
						talking_photo_style: 'square',
						talking_style: 'stable', // Default value
						expression: 'default', // Default value
						offset: { x: 0, y: 0 }
					},
					voice: {
						type: 'text',
						voice_id: 'df393bed984b4a0a84466386b5ff8052',
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
			]
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
				// 새로만든 videoId
				heygenVideoId = response.data.video_id;
				getVideo();
			} else {
				alert('Video generation failed.');
			}
		},
		error: function(err) {
			console.error('Error:', err);
		}
	});
}

// 영상 정보 가져오기
function getVideo() {
	// 임시로 만들어져 있는거 가져오기 ( 원래는 삭제 )
	heygenVideoId = "e567e85c08674111a86f487d14018356";

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
	var length = $('.generated-video.received').length;
	var html = '<video class="generated-video received_' +length+ '" controls autoPlay></video>';

	$('.messages-wrapper').append(html);
	$('.messages-wrapper').scrollTop($('.messages-wrapper')[0].scrollHeight);
	$('.generated-video.received_' +length).attr('src', videoUrl);
}


