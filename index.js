const { TalkClient, AuthApiClient } = require('node-kakao');

// ⚠️ 본인 카카오 계정 정보 입력
const KAKAO_EMAIL = "net_dolph@naver.com"; 
const KAKAO_PASSWORD = "tk4$fkdgo";

const DEVICE_UUID = "render_bot_device_unique_9988"; 
const DEVICE_NAME = "Render_Bot_Server";

let authApi = null;

async function startBot() {
    const client = new TalkClient();

    // 1. 메시지 수신부 (여기에 인증 처리 로직을 넣었습니다)
    client.on('message', async (chat) => {
        const messageText = chat.text.trim();

        // [인증 처리 단계] 스마트폰 카톡으로 "!인증 12345" 라고 보내면 작동합니다.
        if (messageText.startsWith('!인증 ') && authApi) {
            const passcode = messageText.replace('!인증 ', '').trim();
            try {
                const registerRes = await authApi.registerDevice({
                    email: KAKAO_EMAIL,
                    password: KAKAO_PASSWORD,
                    passcode: passcode,
                    permanent: true
                });

                if (registerRes.status === 0) {
                    await chat.replyText("✅ 기기 인증에 성공했습니다! 서버를 재시작하면 정상 구동됩니다.");
                    console.log("인증 성공! 렌더(Render) 대시보드에서 'Restart Service'를 눌러 재시작해주세요.");
                } else {
                    await chat.replyText(`❌ 인증 실패: ${registerRes.status}`);
                }
            } catch (err) {
                await chat.replyText("인증 중 오류가 발생했습니다.");
            }
            return;
        }

        // [기본 자동응답 로직] 
        if (messageText === "핑") {
            await chat.replyText("퐁!");
        }
    });

    // 2. 로그인 시도
    try {
        authApi = await AuthApiClient.create(DEVICE_NAME, DEVICE_UUID);
        const loginRes = await authApi.login({
            email: KAKAO_EMAIL,
            password: KAKAO_PASSWORD,
            forced: true
        });

        if (loginRes.status === -100) { 
            // 인증이 필요한 상태라면 스마트폰으로 인증번호를 보냅니다.
            console.log("⚠️ 최초 기기 인증이 필요합니다. 스마트폰 카카오톡으로 인증번호가 발송되었습니다.");
            await authApi.requestPasscode({
                email: KAKAO_EMAIL,
                password: KAKAO_PASSWORD
            });
            console.log("카카오톡 채팅창에 '!인증 번호' 형태로 입력해주세요. (예: !인증 1234)");
        } else if (loginRes.status === 0) {
            console.log("저 카카오톡 자동응답 봇 서버가 정상 구동 중입니다.");
        }
    } catch (err) {
        console.error("로그인 중 에러 발생:", err);
    }
}

startBot();
