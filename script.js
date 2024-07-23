

var apiKey = "";
var assistantId = "";
var threadId = "";
var lastMessage = "";
var elevenApiKey = '';
var elevenVoiceId = '';
var heygenApiKey = "";
var heygenVideoId = "";
var heygenTalkingPhotoId= "";
var heygenElevenVoiceId= "";
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
					lastMessage = message.content[0].text.value;

					if(lastMessage.length > 100){
						speakText();
					}else{
						// generateVideo();
						getVideo();
					}
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
		messageElement = $('<div style="height: 200px; overflow-y: auto;"></div>').addClass('message').addClass(type).addClass(type + "_"+$(".message.received").length).html(message);
	}else{
		messageElement = $('<div></div>').addClass('message').addClass(type).html(message);
	}
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
			addMessage(lastMessage, 'received');
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
	console.log(lastMessage);

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
	/*lastMessage = "저는 소프트웨어 개발 분야에 2년간의 경력을 가진 고병권입니다. 중앙대학교 소프트웨어개발학과를 졸업하고 2년간 (주)ABC에서 IT 개발 업무를 수행했습니다.\n" +
		"\n" +
		"저는 사람들과 협력하여 일하는 것을 좋아하고, 서로 소통하며 문제를 해결하는 과정에 큰 보람을 느낍니다. 또한, 새로운 기술을 배우는 데 적극적이며, 끊임없이 발전하려는 자세를 가지고 있습니다.\n" +
		"\n" +
		"저는 나이스 지니데이타의 소프트웨어 개발 직무에 지원하게 된 이유는, 저의 기술과 경험을 바탕으로 회사의 성장에 기여하고 싶기 때문입니다. 특히, (회사의 서비스 또는 사업 분야에 대한 관심과 지원 직무와의 관련성을 구체적으로 기술) 분야에 대한 저의 관심과 경험을 바탕으로, (구체적인 역량 및 기여 가능성을 제시) 하고 싶습니다.\n" +
		"\n" +
		"저는 빠르게 배우고 적응하는 능력이 뛰어나며, 긍정적이고 협조적인 성격을 가지고 있습니다. 저에게 기회를 주신다면, 최선을 다해 회사에 기여하겠습니다." +
		"\n" +
		"저는 소프트웨어 개발 분야에 2년간의 경력을 가진 고병권입니다. 중앙대학교 소프트웨어개발학과를 졸업하고 2년간 (주)ABC에서 IT 개발 업무를 수행했습니다.\n" +
		"\n" +
		"저는 사람들과 협력하여 일하는 것을 좋아하고, 서로 소통하며 문제를 해결하는 과정에 큰 보람을 느낍니다. 또한, 새로운 기술을 배우는 데 적극적이며, 끊임없이 발전하려는 자세를 가지고 있습니다.\n" +
		"\n" +
		"저는 나이스 지니데이타의 소프트웨어 개발 직무에 지원하게 된 이유는, 저의 기술과 경험을 바탕으로 회사의 성장에 기여하고 싶기 때문입니다. 특히, (회사의 서비스 또는 사업 분야에 대한 관심과 지원 직무와의 관련성을 구체적으로 기술) 분야에 대한 저의 관심과 경험을 바탕으로, (구체적인 역량 및 기여 가능성을 제시) 하고 싶습니다.\n" +
		"\n" +
		"저는 빠르게 배우고 적응하는 능력이 뛰어나며, 긍정적이고 협조적인 성격을 가지고 있습니다. 저에게 기회를 주신다면, 최선을 다해 회사에 기여하겠습니다."*/
	$('.generated-video').each(function() {
		this.pause();
		this.currentTime = 0;
		$(this).css("width", "300px").css("height", "300px");
		$(".message.received").css("width", "");
		$(".message.received").css("max-width", "70%");
	});

	var length = $('.generated-video').length;
	var html = '<video class="generated-video received_' + length + '" controls autoPlay></video>';

	$('.messages-wrapper').append(html);
	$('.messages-wrapper').scrollTop($('.messages-wrapper')[0].scrollHeight);
	var videoElement = $('.generated-video.received_' + length).get(0);

	removeTypingIndicator();
	addMessage(lastMessage, 'received');

	$(".message.received").eq($(".message.received").length-1).css("width","100%");
	$(".message.received").eq($(".message.received").length-1).css("max-width","97%");


	videoElement.src = videoUrl;
	videoElement.addEventListener('ended', function() {
		videoElement.style.width = '300px';
		videoElement.style.height = '300px';
		$(".message.received").css("width", "").css("max-width", "70%").css("height", "").css("overflow-y", "");
	});


}



