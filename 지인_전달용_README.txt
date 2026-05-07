안녕하세요! 이 프로젝트를 전달받으신 분을 위한 안내서입니다.

현재 전달받으신 소스 코드는 Next.js 기반의 웹 애플리케이션입니다.
본인의 PC에서 실행하거나(로컬 실행), 인터넷에 배포하여 누구나 접속할 수 있게(온라인 배포) 만들 수 있습니다.
목적에 따라 아래의 가이드를 따라 진행해 주세요.

---

## [옵션 1] 내 PC에서만 실행하기 (로컬 실행)

### 1. 사전 준비 (필수 프로그램 설치)
앱을 실행하려면 컴퓨터에 Node.js가 설치되어 있어야 합니다.
- Node.js 설치: https://nodejs.org/ 에 접속하여 'LTS' 버전을 다운로드하고 설치해 주세요.

### 2. API 키 설정 (중요)
이 프로젝트는 OpenAI의 API를 사용합니다.
1. 프로젝트 폴더 최상단에 `.env` (또는 `.env.local`) 이라는 새 파일을 만듭니다.
2. 메모장으로 해당 파일을 열고 아래와 같이 본인의 OpenAI API 키를 작성합니다.
   ```
   OPENAI_API_KEY="sk-여기에-본인의-실제-API-키를-입력하세요"
   ```
3. 저장 후 닫습니다.

### 3. 필수 패키지 설치 및 실행
1. 프로젝트 폴더 빈 공간에서 우클릭 후 [터미널에서 열기]를 선택합니다.
2. `npm install` 을 입력하고 Enter를 눌러 패키지를 설치합니다.
3. 설치가 끝나면 `npm run dev` 를 입력하여 앱을 실행합니다.
4. 브라우저에서 `http://localhost:3000` 으로 접속하여 앱을 사용합니다!

---

## [옵션 2] 나만의 URL로 인터넷에 배포하기 (Vercel 무료 배포)

이 프로젝트를 지인 본인의 GitHub에 올리고, Vercel을 통해 무료로 인터넷상에 배포할 수 있습니다.

### 1. GitHub에 소스 코드 올리기
1. 본인의 GitHub(https://github.com/) 에 로그인하고 'New repository'를 클릭하여 새 저장소를 만듭니다. (저장소 이름은 자유롭게 지정)
2. PC에 Git이 설치되어 있어야 합니다. (미설치 시 https://git-scm.com/ 에서 설치)
3. 다운로드 받은 소스 코드 폴더에서 터미널을 열고 아래 명령어를 순서대로 입력합니다.
   ```
   git init
   git add .
   git commit -m "첫 업로드"
   git branch -M main
   git remote add origin [본인이 방금 만든 GitHub 저장소 주소(예: https://github.com/아이디/저장소.git)]
   git push -u origin main
   ```
   (※ `.env` 파일은 GitHub에 올라가지 않도록 설정되어 있으니 안심하셔도 됩니다.)

### 2. Vercel로 무료 배포하기
Next.js 앱은 Vercel을 통해 클릭 몇 번으로 아주 쉽게 배포할 수 있습니다.
1. Vercel(https://vercel.com/) 에 접속하여 본인의 GitHub 계정으로 가입/로그인합니다.
2. 메인 대시보드에서 [Add New...] -> [Project]를 클릭합니다.
3. [Import Git Repository]에서 방금 소스코드를 올린 GitHub 저장소를 찾아 [Import] 버튼을 누릅니다.
4. **(가장 중요) Environment Variables 설정**
   - 배포 설정 화면 중간에 'Environment Variables' 토글 메뉴가 있습니다. 클릭해서 펼칩니다.
   - Name에는 `OPENAI_API_KEY` 를 입력합니다.
   - Value에는 본인의 **실제 OpenAI API 키(`sk-...`)**를 입력합니다.
   - [Add] 버튼을 눌러 추가합니다.
5. 마지막으로 [Deploy] 버튼을 누릅니다.
6. 1~2분 정도 배포 과정이 진행된 후, 축하 화면과 함께 나만의 접속 주소(URL)가 생성됩니다! 해당 주소로 접속하면 언제 어디서든 모바일이나 PC로 이용하실 수 있습니다.

---

**[문제 발생 시 참고사항]**
- API 키가 잘못되었거나 한도를 초과한 경우 서버에서 오류가 발생할 수 있으니 OpenAI 계정의 잔여 크레딧을 꼭 확인해 주세요.
