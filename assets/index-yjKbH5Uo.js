(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const PRIZE = {
  FIFTH: 5e3,
  FOURTH: 5e4,
  THIRD: 15e5,
  SECOND: 3e7,
  FIRST: 2e9
};
const LOTTO_RULES = {
  PRICE: 1e3,
  MIN_NUMBER: 1,
  MAX_NUMBER: 45,
  LENGTH: 6
};
const RANK_MAP_WEB = {
  FIRST: "6개",
  SECOND: "5개+보너스 볼",
  THIRD: "5개",
  FOURTH: "4개",
  FIFTH: "3개"
};
class Lotto {
  #numbers;
  constructor(numbers) {
    const nums = numbers.map(Number);
    this.#validate(nums);
    this.#numbers = nums;
  }
  #validate(nums) {
    const hasNaN = nums.some((n) => Number.isNaN(n));
    if (hasNaN) {
      throw new Error("[ERROR] 각 번호가 숫자가 아닙니다!");
    }
    const isOutRange = nums.some((n) => n < LOTTO_RULES.MIN_NUMBER || n > LOTTO_RULES.MAX_NUMBER);
    if (isOutRange) {
      throw new Error(`[ERROR] 당첨 번호는 ${LOTTO_RULES.MIN_NUMBER}~${LOTTO_RULES.MAX_NUMBER} 범위여야 합니다!`);
    }
    if (nums.length !== LOTTO_RULES.LENGTH) {
      throw new Error(`[ERROR] 번호는 ${LOTTO_RULES.LENGTH}개여야 합니다!`);
    }
    if (new Set(nums).size !== nums.length) {
      throw new Error("[ERROR] 중복된 숫자가 있습니다.");
    }
    return nums;
  }
  // 당첨 번호 일치 개수 세기
  countMatches(winningNumbers) {
    return this.#numbers.filter((num) => winningNumbers.includes(num)).length;
  }
  // 보너스 번호 포함 여부 확인
  hasBonus(bonusNumber) {
    return this.#numbers.includes(bonusNumber);
  }
  getNumbers() {
    return this.#numbers;
  }
  // 로또 번호 배열을 문자열 형태로 표현
  getFormattedNumbers() {
    return `[${this.#numbers.join(", ")}]`;
  }
}
const LottoMachine = {
  issueLottos(purchasePriceStr, generateRandomNumber) {
    const purchasePrice = validatePurchasePrice(purchasePriceStr);
    const ticketsCount = purchasePrice / LOTTO_RULES.PRICE;
    return Array.from({ length: ticketsCount }, () => createLotto(generateRandomNumber));
  }
};
const validatePurchasePrice = (purchasePriceStr) => {
  const numPrice = Number(purchasePriceStr.trim());
  if (Number.isNaN(numPrice)) {
    throw new Error("[ERROR] 구입 금액이 숫자가 아닙니다!");
  }
  if (numPrice < LOTTO_RULES.PRICE) {
    throw new Error(`[ERROR] 구입 최소 금액은 ${LOTTO_RULES.PRICE}원 입니다!`);
  }
  return numPrice;
};
const createLotto = (generateRandomNumber) => {
  const lottoNumbers = generateRandomNumber().toSorted((a, b) => a - b);
  return new Lotto(lottoNumbers);
};
const LottoResult = {
  calculateWinningResult(lottos, LuckyNumbers2) {
    const result = { FIRST: 0, SECOND: 0, THIRD: 0, FOURTH: 0, FIFTH: 0 };
    for (const lotto of lottos) {
      const match = lotto.countMatches(LuckyNumbers2.winningNumbers());
      const hasBonus = lotto.hasBonus(LuckyNumbers2.bonusNumber());
      if (match === 6) result["FIRST"]++;
      else if (match === 5 && hasBonus) result["SECOND"]++;
      else if (match === 5) result["THIRD"]++;
      else if (match === 4) result["FOURTH"]++;
      else if (match === 3) result["FIFTH"]++;
    }
    return result;
  },
  calculateProfitRate(winningResult, purchasePrice) {
    const totalPrize = calculateTotalPrize(winningResult);
    const profitRate = (totalPrize - purchasePrice) / purchasePrice * 100;
    return Number(profitRate.toFixed(1));
  }
};
const calculateTotalPrize = (winningResult) => {
  return Object.entries(winningResult).reduce(
    (sum, [key, count]) => sum + PRIZE[key] * count,
    0
  );
};
class LuckyNumbers {
  #winningLotto;
  #bonusNumber;
  constructor(winningNumbers, bonusNumber) {
    this.#winningLotto = new Lotto(winningNumbers);
    this.#bonusNumber = this.#validateBonusNumber(bonusNumber);
  }
  #validateBonusNumber(bonusNumber) {
    const bonus = Number(bonusNumber.trim());
    if (Number.isNaN(bonus) || bonus < LOTTO_RULES.MIN_NUMBER || bonus > LOTTO_RULES.MAX_NUMBER) {
      throw new Error(`[ERROR] 보너스 번호는 ${LOTTO_RULES.MIN_NUMBER}~${LOTTO_RULES.MAX_NUMBER} 범위의 숫자여야 합니다!`);
    }
    const winningNumbersNum = this.#winningLotto.getNumbers().map(Number);
    if (winningNumbersNum.includes(bonus)) {
      throw new Error("[ERROR] 보너스 번호가 당첨번호와 중복됩니다!");
    }
    return bonus;
  }
  winningNumbers() {
    return this.#winningLotto.getNumbers();
  }
  bonusNumber() {
    return this.#bonusNumber;
  }
}
class LottoWebView {
  constructor() {
    this.purchaseForm = document.querySelector("#purchase-price-form");
    this.purchaseInput = document.querySelector("#purchase-price");
    this.lottoListSection = document.querySelector("#lotto-list-section");
    this.lottoCountText = document.querySelector("#lotto-count-text");
    this.lottoList = document.querySelector("#lotto-list");
    this.luckyNumbersForm = document.querySelector("#lucky-numbers-form");
    this.winningNumbersInputs = document.querySelectorAll(".winning-number");
    this.bonusNumberInput = document.querySelector("input.bonus-number");
    this.resultModal = document.querySelector("#result-modal");
    this.resultTableBody = document.querySelector("#result-table-body");
    this.profitRateText = document.querySelector("#profit-rate-text");
    this.modalCloseButton = document.querySelector("#modal-close-button");
    this.restartButton = document.querySelector("#restart-button");
  }
  // 구입한 로또 목록 렌더링 및 luckyNumbers 입력창 표시
  renderLottos(lottos) {
    this.#show(this.lottoListSection);
    this.#show(this.luckyNumbersForm);
    this.lottoCountText.innerText = `총 ${lottos.length}개를 구입하셨습니다.`;
    const lottosHTML = lottos.map((lotto) => {
      return `<div class="lotto-ticket">🎟️ ${lotto.getNumbers().join(", ")} </div>`;
    }).join("");
    this.lottoList.innerHTML = lottosHTML;
  }
  // 당첨 결과 모달창을 렌더링
  renderResultModal(winningResult, profitRate) {
    const rankOrder = ["FIFTH", "FOURTH", "THIRD", "SECOND", "FIRST"];
    const resultHTML = rankOrder.map((rank) => {
      const matchText = RANK_MAP_WEB[rank];
      const prizeMoney = PRIZE[rank].toLocaleString();
      const count = winningResult[rank];
      return `<tr><td>${matchText}</td><td>${prizeMoney}</td><td>${count}개</td></tr>`;
    }).join("");
    this.resultTableBody.innerHTML = resultHTML;
    this.profitRateText.innerText = `당신의 총 수익률은 ${profitRate}%입니다.`;
    this.#show(this.resultModal);
  }
  // 모달 창을 닫는 기능
  closeModal() {
    this.#hide(this.resultModal);
  }
  // 로또 다시 시작 기능
  resetView() {
    this.#hide(this.resultModal);
    this.#hide(this.luckyNumbersForm);
    this.#hide(this.lottoListSection);
    this.lottoList.innerHTML = "";
    this.purchaseInput.value = "";
    this.winningNumbersInputs.forEach((input) => {
      input.value = "";
    });
    this.bonusNumberInput.value = "";
  }
  showError(message) {
    alert(message);
  }
  // 이벤트 바인딩 관련
  // 구입 폼 제출
  bindPurchaseForm(handler) {
    this.purchaseForm.addEventListener("submit", (event) => {
      event.preventDefault();
      handler(this.purchaseInput.value);
    });
  }
  // luckyNumbers 폼 제출
  bindLuckyNumbersForm(handler) {
    this.luckyNumbersForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const winningNumbers = Array.from(this.winningNumbersInputs).map(
        (input) => Number(input.value)
      );
      const bonusNumber = this.bonusNumberInput.value;
      handler(winningNumbers, bonusNumber);
    });
  }
  // 모달 창 닫기 버튼
  bindModalCloseButton(handler) {
    this.modalCloseButton.addEventListener("click", () => {
      handler();
    });
  }
  // 재시작 버튼
  bindRestartButton(handler) {
    this.restartButton.addEventListener("click", () => {
      handler();
    });
  }
  // hidden 속성을 가진 박스를 화면에 표시
  #show(element) {
    element.classList.remove("hidden");
  }
  // hidden 속성을 가진 박스를 화면에서 숨김
  #hide(element) {
    element.classList.add("hidden");
  }
}
class WebApp {
  constructor() {
    this.lottos = [];
    this.view = new LottoWebView();
  }
  run() {
    this.view.bindPurchaseForm(this.#handlePurchaseForm.bind(this));
    this.view.bindLuckyNumbersForm(this.#handleLuckyNumbersForm.bind(this));
    this.view.bindModalCloseButton(this.#handleModalCloseButton.bind(this));
    this.view.bindRestartButton(this.#handleRestartButton.bind(this));
  }
  // 랜덤 숫자 생성기
  #generateRandomNumber() {
    const nums = /* @__PURE__ */ new Set();
    while (nums.size < LOTTO_RULES.LENGTH) {
      nums.add(Math.floor(Math.random() * LOTTO_RULES.MAX_NUMBER) + LOTTO_RULES.MIN_NUMBER);
    }
    return [...nums];
  }
  // 구입 폼 관련
  #handlePurchaseForm(purchasePriceStr) {
    try {
      const lottos = LottoMachine.issueLottos(
        purchasePriceStr,
        this.#generateRandomNumber
      );
      this.lottos = lottos;
      this.view.renderLottos(lottos);
    } catch (e) {
      this.view.showError(e.message);
    }
  }
  // luckyNumbers 폼 관련
  #handleLuckyNumbersForm(winningNumbers, bonusNumber) {
    try {
      const luckyNumbers = new LuckyNumbers(winningNumbers, bonusNumber);
      const winningResult = LottoResult.calculateWinningResult(
        this.lottos,
        luckyNumbers
      );
      const purchasePrice = this.lottos.length * LOTTO_RULES.PRICE;
      const profitRate = LottoResult.calculateProfitRate(
        winningResult,
        purchasePrice
      );
      this.view.renderResultModal(winningResult, profitRate);
    } catch (e) {
      this.view.showError(e.message);
    }
  }
  // 모달 창 닫기 버튼 관련
  #handleModalCloseButton() {
    this.view.closeModal();
  }
  // 재시작 버튼 관련
  #handleRestartButton() {
    this.lottos = [];
    this.view.resetView();
  }
}
const webApp = new WebApp();
webApp.run();
