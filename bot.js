const { TalkClient, AuthApiClient } = require('node-kakao');
const http = require('http');

// ⚠️ 본인 카카오 계정 정보 입력 (오타가 없는지 꼭! 다시 확인해주세요)
const KAKAO_EMAIL = `net_dolph@naver.com`; 
const KAKAO_PASSWORD = `tk4$fkdgo`;

const DEVICE_UUID = "render_bot_device_unique_9988"; 
const DEVICE_NAME = "Render_Bot_Server";

// 💡 서버가 켜지자마자 가장 먼저 웹서버부터 띄워서 Render가 강제 종료하는 것을 원천 차단합니다.
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('카카오톡 자동응답 봇 서버가 살아있습니다.');
}).listen(PORT, () => {
    console.log(`=============================================`);
    console.log(`[1단계 성공] 웹 서버가 포트 ${PORT}에서 정상 대기 중입니다.`);
    console.log(`=============================================`);
});

let authApi = null;

async function startBot() {
    try {
        const client = new TalkClient();

        // 1. 메시지 수신부
        client.on('message', async (chat) => {
            const messageText = chat.text.trim();

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
                        await chat.replyText("✅ 기기 인증에 성공했습니다! Render 대시보드에서 'Restart Service'를 눌러주세요.");
                        console.log("인증 성공! 렌더 대시보드에서 'Manual Deploy -> Restart Service'를 눌러주세요.");
                    } else {
                        await chat.replyText(`❌ 인증 실패: ${registerRes.status}`);
                    }
                } catch (err) {
                    await chat.replyText("인증 중 오류가 발생했습니다.");
                }
                return;
            }

            if (messageText === "핑") {
                await chat.replyText("퐁!");
            }
        });

        // 2. 로그인 시도
        console.log("[2단계] 카카오톡 로그인 시도 중...");
        authApi = await AuthApiClient.create(DEVICE_NAME, DEVICE_UUID);
        const loginRes = await authApi.login({
            email: KAKAO_EMAIL,
            password: KAKAO_PASSWORD,
            forced: true
        });

        if (loginRes.status === -100) { 
            console.log("=============================================");
            console.log("⚠️ 최초 기기 인증이 필요합니다. 스마트폰 카톡을 확인하세요!");
            console.log("카카오톡 채팅창에 '!인증 번호' 형태로 입력해주세요. (예: !인증 1234)");
            console.log("=============================================");
            await authApi.requestPasscode({
                email: KAKAO_EMAIL,
                password: KAKAO_PASSWORD
            });
        } else if (loginRes.status === 0) {
            console.log("=============================================");
            console.log("🎉 로그인 성공! 카카오톡 봇이 정상 구동 중입니다.");
            console.log("=============================================");
        } else {
            console.log(`❌ 카카오 로그인 거부 (상태코드: ${loginRes.status})`);
        }

    } catch (err) {
        // 💡 에러가 나서 튕기더라도 왜 튕겼는지 콘솔에 명확하게 범인을 박아줍니다.
        console.log("🚨 [치명적 에러 발생] 서버가 다운된 원인 분석:");
        console.error(err);
    }
}

// 딜레이를 살짝 주어 웹서버가 확실히 켜진 뒤 카카오 로그인을 하도록 합니다.
setTimeout(() => {
    startBot();
}, 1000);
