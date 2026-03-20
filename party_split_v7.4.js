let people = JSON.parse(localStorage.people || "[]");
let party = JSON.parse(localStorage.party || "[]");
let personal = JSON.parse(localStorage.personal || "[]");
let advance = JSON.parse(localStorage.advance || "[]");

// 新增: 群組資料
let groups = JSON.parse(localStorage.groups || "[]");

// 新增: 編輯人員選中狀態
let editSelectedIndex = null;
let editGroupIndex = null;

// 新增: 全域變數記錄群組勾選
let groupSelectedPeople = [];

// 新增: 主要付錢人狀態
let primaryPayer = localStorage.primaryPayer || "";
let consolidateAdvance = JSON.parse(localStorage.consolidateAdvance || "false");

// ===== 共用 Helper 函式 =====
function floor2(x) {
    return Math.floor((Number(x) || 0) * 100) / 100;
}

function fmtMoney(x) {
    return floor2(x).toFixed(2);
}

// 建立付款人下拉 HTML（一般用途）
function buildPayerSelectHtml(handlerName, idx, selected, includeDefaultPerson) {
    let html = `<select onchange="${handlerName}(${idx}, this.value)">`;
    html += '<option value="">付款人</option>';
    for (let pi = 0; pi < people.length; pi++) {
        let pp = people[pi];
        let sel = '';
        if (selected && selected === pp) sel = 'selected';
        // 如果沒有 selected，但要求 includeDefaultPerson 且 pp 為預設人，則選中
        if (!selected && includeDefaultPerson && includeDefaultPerson === pp) sel = 'selected';
        html += `<option value="${pp}" ${sel}>${pp}</option>`;
    }
    html += '</select>';
    return html;
}

// 建立 advance 的成員選單（維持原有行為）
function buildAdvanceMemberSelectHtml(n, a) {
    let memberSelect = '<select onchange="setAdvanceMembers(' + n + ', this.value)">';
    let allSelected = (a.members && a.members.length === people.length) ? 'selected' : '';
    memberSelect += `<option value="ALL" ${allSelected}>全部</option>`;
    for (let gi = 0; gi < groups.length; gi++) {
        let grp = groups[gi];
        let grpSel = '';
        if (a.members && Array.isArray(a.members) && grp.members && grp.members.join(',') === a.members.join(',')) grpSel = 'selected';
        memberSelect += `<option value="GROUP_${gi}" ${grpSel}>群組：${grp.name}</option>`;
    }
    let customSel = (a.custom) ? 'selected' : '';
    memberSelect += `<option value="CUSTOM" ${customSel}>自訂</option>`;
    memberSelect += '</select>';
    return memberSelect;
}
// ===== end helpers =====

function save() {
    localStorage.people = JSON.stringify(people);
    localStorage.party = JSON.stringify(party);
    localStorage.personal = JSON.stringify(personal);
    localStorage.advance = JSON.stringify(advance);
    localStorage.groups = JSON.stringify(groups);
}

function render() {
    // 合併顯示一般名單與編輯功能
    peopleList.innerHTML = "";
    for (let i = 0; i < people.length; i++) {
        let html = '<li>';
        html += '<span>' + people[i] + '</span>';
        html += ' <button onclick="deletePerson(' + i + ')">刪除</button>';
        html += '</li>';
        peopleList.innerHTML += html;
    }

    partyTable.innerHTML = "";
    for (let k = 0; k < party.length; k++) {
        let p = party[k];
        let members = p.members || [];
        let checkboxHTML = '<div class="member-box">';
        for (let l = 0; l < people.length; l++) {
            let person = people[l];
            let checked = members.includes(person) ? "checked" : "";
            checkboxHTML += '<label>';
            checkboxHTML += '<input type="checkbox" ' + checked + ' onchange="toggleMember(' + k + ', \'' + person + '\')">';
            checkboxHTML += person;
            checkboxHTML += '</label>';
        }
        // 群組選擇（「全部」/已建立群組），並加入單項「全部取消」按鈕
        // 「全部」
        let allChecked = (members.length === people.length) ? "checked" : "";
        checkboxHTML += `<label style="background:#cce;"><input type="radio" name="party_group_${k}" onclick="setPartyGroup(${k}, -1)" ${allChecked}>全部</label>`;
        // 已建立群組
        for (let g = 0; g < groups.length; g++) {
            let grpMembers = groups[g].members || [];
            let checked = (grpMembers.length > 0 && grpMembers.join(',') === members.join(',')) ? "checked" : "";
            checkboxHTML += `<label style="background:#cce;"><input type="radio" name="party_group_${k}" onclick="setPartyGroup(${k}, ${g})" ${checked}>${groups[g].name}</label>`;
        }
        // 加入單項「全部取消」按鈕（清除此項分攤人）
        checkboxHTML += `<button type="button" style="margin-left:8px;padding:6px;border-radius:8px;border:1px solid #e6e9ee;background:#fff;color:var(--accent);" onclick="clearPartyMembers(${k})">全部取消</button>`;
        checkboxHTML += '</div>';

        // 付款人下拉（每筆品項）
        let payerHTML = buildPayerSelectHtml('setPartyPayer', k, p.payer, false);
        partyTable.innerHTML += '<tr>' + '<td>' + p.cat + '</td>' + '<td>' + p.item + '</td>' + '<td>' + p.price + '</td>' + '<td>' + checkboxHTML + '</td>' +'<td>' + payerHTML + '</td>' + '<td><button onclick="deleteParty(' + k + ')">刪除</button></td>' + '</tr>';
    }

    personalTable.innerHTML = "";
    for (let m = 0; m < personal.length; m++) {
        let p = personal[m];
        // 個人費用也加入付款人下拉（預設為 p.payer 或 p.person）
        let payerHTML = buildPayerSelectHtml('setPersonalPayer', m, p.payer, p.person);

        personalTable.innerHTML += '<tr>' + '<td>' + p.person + '</td>' + '<td>' + p.item + '</td>' + '<td>' + p.price + '</td>' + '<td>' + payerHTML+ '</td>' + '<td>' + '<button onclick="deletePersonal(' + m + ')"> 刪除</button></td>' + '</tr>';
    }

    advanceTable.innerHTML = "";
    for (let n = 0; n < advance.length; n++) {
        let a = advance[n];
        // 建立分攤成員選單（全部 / 已建立群組 / 自訂）
        let memberSelect = buildAdvanceMemberSelectHtml(n, a);

        // 顯示當前成員簡短說明
        let memberSummary = '';
        if (a.members && a.members.length) {
            memberSummary = a.members.join(', ');
            if (memberSummary.length > 40) memberSummary = memberSummary.substring(0, 40) + '...';
        } else {
            memberSummary = '全部';
        }

        advanceTable.innerHTML += '<tr>' +
            '<td>' + a.person + '</td>' +
            '<td>' + a.item + '</td>' +
            '<td>' + a.price + '</td>' +
            '<td>' + memberSelect + '<div style="margin-top:6px;font-size:12px;color:#666;">' + memberSummary + '</div></td>' +
            '<td><button onclick="editAdvanceMembers(' + n + ')">編輯成員</button> <button onclick="deleteAdvance(' + n + ')">刪除</button></td>' +
            '</tr>';
    }

    // 顯示可勾選人員清單（群組建立用），保留勾選狀態
    let groupSelectHTML = '';
    for (let i = 0; i < people.length; i++) {
        let checked = groupSelectedPeople.includes(people[i]) ? "checked" : "";
        groupSelectHTML += `<label><input type="checkbox" class="group-person" value="${people[i]}" ${checked} onchange="onGroupPersonChange(this)"> ${people[i]}</label>`;
    }
    groupSelectBox.innerHTML = groupSelectHTML;

    // 顯示已建立群組列表，並加上編輯按鈕 & 套用按鈕
    groupList.innerHTML = '';
    for (let i = 0; i < groups.length; i++) {
        groupList.innerHTML += `<li>
        <b>${groups[i].name}</b>：${groups[i].members.join(', ')}
        <button onclick="editGroup(${i})">編輯</button>
        <button onclick="deleteGroup(${i})">刪除</button>
    </li>`;
    }

    // 編輯群組人員區塊
    if (editGroupIndex !== null && groups[editGroupIndex]) {
        let group = groups[editGroupIndex];
        let html = `<div style="padding:10px; border:1px solid #ccc; background:#f9f9f9;">
        <b>編輯群組「${group.name}」</b><br>`;
        for (let i = 0; i < people.length; i++) {
            let checked = group.members.includes(people[i]) ? "checked" : "";
            html += `<label style="margin-right:8px;">
            <input type="checkbox" value="${people[i]}" ${checked} onchange="toggleGroupMember(${editGroupIndex},'${people[i]}')">
            ${people[i]}
        </label>`;
        }
        html += `<br><button onclick="saveGroupEdit()">儲存</button>
        <button onclick="cancelGroupEdit()">取消</button>
    </div>`;
        groupEditBox.innerHTML = html;
        groupEditBox.style.display = '';
    } else {
        groupEditBox.innerHTML = '';
        groupEditBox.style.display = 'none';
    }

    // === 新增：建立主要付錢人下拉與合併勾選狀態 (每次 render 更新) ===
    (function updatePrimaryPayerUI() {
        const sel = document.getElementById('primaryPayerSelect');
        const chk = document.getElementById('consolidateAdvance');
        if (sel) {
            sel.innerHTML = '<option value="">（未選擇）</option>';
            for (let i = 0; i < people.length; i++) {
                const p = people[i];
                const selected = (p === primaryPayer) ? ' selected' : '';
                sel.innerHTML += `<option value="${p}"${selected}>${p}</option>`;
            }
            // 若 primaryPayer 已被刪除，清除記錄
            if (primaryPayer && !people.includes(primaryPayer)) {
                primaryPayer = "";
                localStorage.primaryPayer = "";
                sel.value = "";
            } else {
                sel.value = primaryPayer || "";
            }
        }
        if (chk) {
            chk.checked = !!consolidateAdvance;
        }
    })();
    // === end updatePrimaryPayerUI ===
}

// 清空總計顯示（當上方資料變動時呼叫）
function clearResult() {
    const resEl = document.getElementById('result');
    if (resEl) resEl.textContent = '';
}

function addPerson() {
    clearResult();
    let name = personName.value.trim();
    if (name === "") {
        return;
    }
    if (!people.includes(name)) {
        people.push(name);
    }
    personName.value = "";
    save();
    render();
}

function importPeople() {
    clearResult();
    // 支援各種分隔符：半型/全型空白、換行、Tab、英文逗號/中文逗號、分號等
    let raw = bulkPeople.value || '';
    raw = raw.trim();
    if (raw === '') return;

    // 將所有常見分隔符統一轉成英文逗號，再分割
    // \u3000 = 全形空格
    let normalized = raw.replace(/[\s\u3000,，;；\t]+/g, ',');
    let arr = normalized.split(',').map(s => s.trim()).filter(Boolean);

    for (let i = 0; i < arr.length; i++) {
        let p = arr[i];
        if (p !== "") {
            if (!people.includes(p)) {
                people.push(p);
            }
        }
    }
    bulkPeople.value = "";
    save();
    render();
}

function toggleMember(i, person) {
    clearResult();
    let arr = party[i].members;
    if (arr.includes(person)) {
        party[i].members = arr.filter(function (x) {
            return x !== person;
        });
    } else {
        arr.push(person);
    }
    save();
}

// 新增：設定每筆 party 的付款人
function setPartyPayer(idx, payer) {
    clearResult();
    party[idx].payer = payer || '';
    save();
    render();
}

// 新增：設定每筆 personal 的付款人
function setPersonalPayer(idx, payer) {
    clearResult();
    personal[idx].payer = payer || '';
    save();
    render();
}

// 新增：依照群組套用該列分攤人（-1 = 全部, number = groups[index]）
function setPartyGroup(idx, gIdx) {
    clearResult();
    if (!party[idx]) {
        return;
    }
    if (gIdx === -1) {
        // 全部
        party[idx].members = people.slice();
    } else {
        const grp = groups[gIdx];
        if (grp && Array.isArray(grp.members)) {
            party[idx].members = grp.members.slice();
        } else {
            party[idx].members = [];
        }
    }
    save();
    render();
}

// 新增：單項全部取消（清空該列 members）
function clearPartyMembers(idx) {
    clearResult();
    if (!party[idx]) {
        return;
    }
    if (!confirm('確定要將此項目的所有分攤人取消嗎？')) {
        return;
    }
    party[idx].members = [];
    save();
    render();
}

// 設定 advance 的分攤成員（來自選單）
function setAdvanceMembers(idx, val) {
    clearResult();
    if (!advance[idx]) return;
    if (val === 'ALL') {
        advance[idx].members = people.slice();
        advance[idx].custom = false;
    } else if (val.indexOf('GROUP_') === 0) {
        let gi = parseInt(val.split('_')[1]);
        if (groups[gi] && Array.isArray(groups[gi].members)) {
            advance[idx].members = groups[gi].members.slice();
        } else {
            advance[idx].members = [];
        }
        advance[idx].custom = false;
    } else if (val === 'CUSTOM') {
        // 轉到編輯模式 prompting 使用者輸入
        editAdvanceMembers(idx);
        return;
    }
    save();
    render();
}

// 以 prompt 編輯 advance 的分攤成員（簡單實作）
function editAdvanceMembers(idx) {
    clearResult();
    if (!advance[idx]) return;
    let current = (advance[idx].members && advance[idx].members.length) ? advance[idx].members.join(',') : '';
    let input = prompt('請輸入分攤成員（逗號或空白分隔）：', current);
    if (input === null) return; // 取消
    let arr = input.replace(/\u3000/g, ' ').split(/[\s,，;；]+/).map(s => s.trim()).filter(Boolean);
    if (arr.length === 0) {
        // 若輸入空，則回到全部
        advance[idx].members = people.slice();
        advance[idx].custom = false;
    } else {
        advance[idx].members = arr;
        advance[idx].custom = true;
    }
    save();
    render();
}

function parseText() {
    clearResult();
    let lines = importText.value.split("\n");
    let cat = "未分類";
    for (let i = 0; i < lines.length; i++) {
        let raw = lines[i].trim();
        if (raw === "") {
            continue;
        }
        // 區塊標題（例：---- 雞蛋糕費用 ----）
        if (/費用/.test(raw) && /-{3,}/.test(raw)) {
            cat = raw.replace(/[-]+/g, "").trim();
            continue;
        }
        if (raw.includes("小計") || raw.includes("總計")) {
            continue;
        }

        // 解析價格（取最後一個數字，支援小數與 "x * y" 格式）
        let price = 0;
        let multi = raw.match(/(\d+(?:\.\d+)?)\s*\*\s*(\d+(?:\.\d+)?)/);
        if (multi) {
            price = parseFloat(multi[1]) * parseFloat(multi[2]);
        } else {
            let nums = raw.match(/(\d+(?:\.\d+)?)/g);
            if (nums && nums.length > 0) {
                price = Math.round(parseFloat(nums[nums.length - 1]));
            } else {
                price = 0;
            }
        }

        // 若含有 "出"（但沒有 /X人）則視為代出（advance），例如：藍天出 大布丁 167元
        if (raw.includes("出")) {
            let parts = raw.split("出");
            let person = parts[0].trim();
            let itemDesc = parts[1] ? parts[1].trim() : "";
            advance.push({
                person: person,
                item: itemDesc,
                price: Number(price) || 0,
                members: people.slice(), // 預設分攤給全部人，使用者可再調整
                custom: false
            });
            continue;
        }

        // 若第一個 token 為已知人名，視為個人費用（personal）
        let tokens = raw.split(/\s+/);
        if (tokens.length > 0 && people.includes(tokens[0])) {
            let person = tokens[0];
            // 將品項描述保留中間部分（去掉人名與最後價格）
            let itemPart = raw.replace(new RegExp('^' + person), '').trim();
            itemPart = itemPart.replace(/(\d+(?:\.\d+)?)(\s*元|(\s*NT\$?)|(\s*\$))?(\s*)$/, '').trim();
            personal.push({
                person: person,
                item: itemPart,
                price: Number(price) || 0,
                payer: primaryPayer || person // 若有主要付錢人則預設為主要付錢人，否則預設本人
            });
            continue;
        }

        // 其餘視為派對項目（party），預設付款人空白，分攤對象為所有人
        party.push({
            cat: cat,
            item: raw,
            price: Number(price) || 0,
            payer: primaryPayer || '', // 若已設定主要付錢人，解析時預設為主要付錢人
            members: people.slice()
        });
    }
    save();
    render();
}

function deleteParty(i) {
    clearResult();
    party.splice(i, 1);
    save();
    render();
}

function deletePersonal(i) {
    clearResult();
    personal.splice(i, 1);
    save();
    render();
}

function deleteAdvance(i) {
    clearResult();
    advance.splice(i, 1);
    save();
    render();
}

// 新增: 點擊人員顯示刪除按鈕
function selectEditPerson(idx) {
    editSelectedIndex = idx;
    render();
}

// 新增: 刪除人員
function deletePerson(idx) {
    clearResult();
    if (!confirm("確定要刪除「" + people[idx] + "」嗎？")) return;
    let name = people[idx];
    people.splice(idx, 1);

    // 同步移除所有費用資料中該人員
    for (let i = 0; i < party.length; i++) {
        if (party[i].members) {
            party[i].members = party[i].members.filter(p => p !== name);
        }
    }
    personal = personal.filter(p => p.person !== name);
    advance = advance.filter(a => a.person !== name);

    // 如果刪除的正是主要付錢人，則清除相關設定
    if (name === primaryPayer) {
        primaryPayer = "";
        localStorage.primaryPayer = "";
    }

    editSelectedIndex = null;
    save();
    render();
}

// 改寫：讀取 DOM 值並存 localStorage
function onPrimaryPayerChange() {
    const sel = document.getElementById('primaryPayerSelect');
    if (!sel) return;
    primaryPayer = sel.value || "";
    localStorage.primaryPayer = primaryPayer;
    // 若有設定主要付錢人，將現有 personal / party 中未指定 payer 的項目預設為主要付錢人
    applyPrimaryPayerDefaults();
}

// 將未指定付款人的 personal 與 party 項目預設為主要付錢人（若有）
function applyPrimaryPayerDefaults() {
    if (!primaryPayer) return;
    let changed = false;
    // personal
    for (let i = 0; i < personal.length; i++) {
        if (!personal[i].payer || personal[i].payer === '') {
            personal[i].payer = primaryPayer;
            changed = true;
        }
    }
    // party (僅影響未指定 payer 的項目)
    for (let i = 0; i < party.length; i++) {
        if (!party[i].payer || party[i].payer === '') {
            party[i].payer = primaryPayer;
            changed = true;
        }
    }
    if (changed) {
        save();
        render();
    }
}

function onConsolidateChange() {
    const chk = document.getElementById('consolidateAdvance');
    if (!chk) return;
    consolidateAdvance = !!chk.checked;
    localStorage.consolidateAdvance = JSON.stringify(consolidateAdvance);
}

function calculate() {
    // 若尚未新增任何人員，禁止執行計算
    if (!people || people.length === 0) {
        alert('請先新增參加人員再進行計算');
        return;
    }
        // 建立 balance 與明細小計（不變）
    let balance = {};
    for (let i = 0; i < people.length; i++) {
        balance[people[i]] = 0;
    }

    let partyShareMap = {};
    let personalTotals = {};
    let advancePaidMap = {};
    for (let i = 0; i < people.length; i++) {
        partyShareMap[people[i]] = 0;
        personalTotals[people[i]] = 0;
        advancePaidMap[people[i]] = 0;
    }

    // 計算每人因派對項目要分擔的份額
    for (let i = 0; i < party.length; i++) {
        let item = party[i];
        let members = item.members && item.members.length ? item.members : people.slice();
        let per = Math.floor((item.price / members.length) * 100) / 100;
        for (let j = 0; j < members.length; j++) {
            balance[members[j]] -= per;
            partyShareMap[members[j]] += per;
        }
    }

    // 計算個人費用（每個人的個人支出會在個人計算步驟顯示）
    for (let i = 0; i < personal.length; i++) {
        let p = personal[i];
        let price2 = Math.floor(Number(p.price) * 100) / 100;
        balance[p.person] -= price2;
        personalTotals[p.person] += price2;
    }

    // 原始代付登記（用於明細與合併判斷）
    for (let i = 0; i < advance.length; i++) {
        let a = advance[i];
        let price2 = Math.floor(Number(a.price) * 100) / 100;
        advancePaidMap[a.person] = (advancePaidMap[a.person] || 0) + price2;
    }

    // 新增：若代付指定了 members，先把每位分攤者扣款（每人份額）
    for (let i = 0; i < advance.length; i++) {
        let a = advance[i];
        let members = (a.members && a.members.length) ? a.members : people.slice();
        if (!members || members.length === 0) continue;
        let per = Math.floor(((Number(a.price) || 0) / members.length) * 100) / 100;
        for (let m of members) {
            if (typeof balance[m] !== 'undefined') {
                balance[m] -= per;
            }
        }
    }

    // 把付款人標記（payer）加入 balance（仍保留原有行為）
    for (let i = 0; i < party.length; i++) {
        let item = party[i];
        if (item.payer && item.payer !== '') {
            if (consolidateAdvance && primaryPayer && item.payer !== primaryPayer) {
                let price2 = Math.floor(item.price * 100) / 100;
                balance[item.payer] -= price2;
                balance[primaryPayer] += price2;
            } else {
                let price2 = Math.floor(item.price * 100) / 100;
                balance[item.payer] += price2;
            }
        }
    }
    for (let i = 0; i < personal.length; i++) {
        let p = personal[i];
        if (p.payer && p.payer !== '') {
            if (consolidateAdvance && primaryPayer && p.payer !== primaryPayer) {
                let price2 = Math.floor(p.price * 100) / 100;
                balance[p.payer] -= price2;
                balance[primaryPayer] += price2;
            } else {
                let price2 = Math.floor(p.price * 100) / 100;
                balance[p.payer] += price2;
            }
        }
    }
    for (let i = 0; i < advance.length; i++) {
        let a = advance[i];
        if (consolidateAdvance && primaryPayer && a.person !== primaryPayer) {
            let price2 = Math.floor(a.price * 100) / 100;
            balance[a.person] -= price2;
            balance[primaryPayer] += price2;
        } else {
            let price2 = Math.floor(a.price * 100) / 100;
            balance[a.person] += price2;
        }
    }

    // 準備債權/債務陣列（將作為配對來源）
    let creditors = [];
    let debtors = [];
    for (let p in balance) {
        if (balance[p] > 0) creditors.push({ p: p, amt: balance[p] });
        if (balance[p] < 0) debtors.push({ p: p, amt: -balance[p] });
    }
    // 排序（大額優先）
    creditors.sort((a, b) => b.amt - a.amt);
    debtors.sort((a, b) => b.amt - a.amt);

    // 優先處理「有明確付款人 (payer)」的定向付款
    // 收集定向付款的「明細項目」並保留配對邏輯
    // directedMap: { debtorName: { payerName: { items: [{desc, amt}], total } } }
    let directedMap = {};
    // 新增: 支援 type（'party'|'personal'|'advance'）以便顯示排序
    function addDirectedItem(debtor, payer, desc, amt, type) {
        if (!directedMap[debtor]) directedMap[debtor] = {};
        if (!directedMap[debtor][payer]) directedMap[debtor][payer] = { items: [], total: 0 };
        directedMap[debtor][payer].items.push({ desc: desc, amt: Number(amt) || 0, type: type || 'personal' });
        directedMap[debtor][payer].total += Number(amt) || 0;
    }
    // 個人費用：先收集明細（用原價），再進行配對扣款
    for (let i = 0; i < personal.length; i++) {
        let it = personal[i];
        if (it.payer && it.payer !== '' && it.person !== it.payer) {
            // 收集：個人品項描述 + 原價
            addDirectedItem(it.person, it.payer, it.item || '(項目)', Number(it.price) || 0, 'personal');
            // 同時保持原本的配對機制（以避免改變實際結算）
            let debtorObj = debtors.find(d => d.p === it.person);
            let creditorObj = creditors.find(c => c.p === it.payer);
            if (!debtorObj || debtorObj.amt <= 0) continue;
            if (!creditorObj) {
                let amt = balance[it.payer] > 0 ? balance[it.payer] : 0;
                creditorObj = { p: it.payer, amt: amt };
                creditors.push(creditorObj);
            }
            let ask = Number(it.price) || 0;
            let pay = Math.min(debtorObj.amt, ask, creditorObj.amt);
            if (pay > 0) {
                debtorObj.amt -= pay;
                creditorObj.amt -= pay;
            }
        }
    }
    // 派對項目：每人成員份額 -> payer（若有指定付款人）
    for (let i = 0; i < party.length; i++) {
        let it = party[i];
        if (it.payer && it.payer !== '') {
            let members = it.members && it.members.length ? it.members : people.slice();
            let per = Math.floor((it.price / members.length) * 100) / 100;
            for (let m of members) {
                if (m === it.payer) continue;
                // 收集該成員對此付款人的「品項(每人份)」
                addDirectedItem(m, it.payer, it.item || '(派對項目)', per, 'party');
                // 仍執行配對扣款（以保持 balance 行為）
                let debtorObj = debtors.find(d => d.p === m);
                let creditorObj = creditors.find(c => c.p === it.payer);
                if (!debtorObj || debtorObj.amt <= 0) continue;
                if (!creditorObj) {
                    let amt = balance[it.payer] > 0 ? balance[it.payer] : 0;
                    creditorObj = { p: it.payer, amt: amt };
                    creditors.push(creditorObj);
                }
                let pay = Math.min(debtorObj.amt, per, creditorObj.amt);
                if (pay > 0) {
                    debtorObj.amt -= pay;
                    creditorObj.amt -= pay;
                }
            }
        }
    }

    // 代付（advance）：依模式產生細項與配對
    for (let i = 0; i < advance.length; i++) {
        let a = advance[i];
        // 忽略不存在或金額為 0 的項目
        if (!a || (Number(a.price) || 0) === 0) continue;
        let members = (a.members && a.members.length) ? a.members : people.slice();
        let per = Math.floor(((Number(a.price) || 0) / members.length) * 100) / 100;
        if (consolidateAdvance && primaryPayer) {
            // 合併模式：把代付的分攤改為「每人 → 主要付錢人」
            for (let m of members) {
                if (m === primaryPayer) continue; // 主要付錢人不欠自己
                addDirectedItem(m, primaryPayer, a.item || '(代出費用)', per);
                // 配對扣款（以保持 balance 行為）
                let debtorObj = debtors.find(d => d.p === m);
                let creditorObj = creditors.find(c => c.p === primaryPayer);
                if (!debtorObj || debtorObj.amt <= 0) continue;
                if (!creditorObj) {
                    let amt = balance[primaryPayer] > 0 ? balance[primaryPayer] : 0;
                    creditorObj = { p: primaryPayer, amt: amt };
                    creditors.push(creditorObj);
                }
                let pay = Math.min(debtorObj.amt, per, creditorObj.amt);
                if (pay > 0) {
                    debtorObj.amt -= pay;
                    creditorObj.amt -= pay;
                }
            }

            // 再用原代付者實際已代付金額調整他對主要付錢人的欠款（抵扣）
            if (a.person && a.person !== primaryPayer) {
                const debtor = a.person;
                const payer = primaryPayer;
                const paidAmt = Number(a.price) || 0;

                // 若已有 debtor -> payer 條目，先用 paidAmt 抵扣該條目
                if (directedMap[debtor] && directedMap[debtor][payer]) {
                    directedMap[debtor][payer].total -= paidAmt;
                    directedMap[debtor][payer].items.push({ desc: '(代出抵扣)', amt: -paidAmt, type: 'advance' });

                    // 若抵扣後 total <= 0，表示主要付錢人需補回差額給原代付者
                    if (directedMap[debtor][payer].total <= 0) {
                        const surplus = -directedMap[debtor][payer].total;
                        // 移除原債務條目
                        delete directedMap[debtor][payer];
                        // 建立反向補償：主要付錢人 -> 原代付者
                        if (!directedMap[payer]) directedMap[payer] = {};
                        if (!directedMap[payer][debtor]) directedMap[payer][debtor] = { items: [], total: 0 };
                        directedMap[payer][debtor].items.push({ desc: a.item + ' (代出補償)', amt: surplus, type: 'advance' });
                        directedMap[payer][debtor].total += surplus;
                    }
                } else {
                    // 若原本沒有 debtor -> payer 條目，直接建立主要付錢人 -> 原代付者 補償項
                    if (!directedMap[payer]) directedMap[payer] = {};
                    if (!directedMap[payer][debtor]) directedMap[payer][debtor] = { items: [], total: 0 };
                    directedMap[payer][debtor].items.push({ desc: a.item + ' (代出補償)', amt: paidAmt });
                    directedMap[payer][debtor].total += paidAmt;
                }
            }
        } else {
            // 原始模式：維持「每人 → 代付者」的顯示與配對行為
            for (let m of members) {
                if (m === a.person) continue;
                    addDirectedItem(m, a.person, a.item || '(代出費用)', per, 'advance');
                let debtorObj = debtors.find(d => d.p === m);
                let creditorObj = creditors.find(c => c.p === a.person);
                if (!debtorObj || debtorObj.amt <= 0) continue;
                if (!creditorObj) {
                    let amt = balance[a.person] > 0 ? balance[a.person] : 0;
                    creditorObj = { p: a.person, amt: amt };
                    creditors.push(creditorObj);
                }
                let pay = Math.min(debtorObj.amt, per, creditorObj.amt);
                if (pay > 0) {
                    debtorObj.amt -= pay;
                    creditorObj.amt -= pay;
                }
            }
        }
    }

    // 移除已為 0 的債權/債務
    creditors = creditors.filter(c => c.amt > 0);
    debtors = debtors.filter(d => d.amt > 0);

    // 接著執行一般配對（貪婪配對）
    let pairLines = [];
    for (let i = 0; i < debtors.length; i++) {
        let d = debtors[i];
        for (let j = 0; j < creditors.length; j++) {
            let c = creditors[j];
            if (d.amt > 0 && c.amt > 0) {
                let pay = Math.min(d.amt, c.amt);
                pairLines.push(`${d.p} → ${c.p} ${pay}`);
                d.amt -= pay;
                c.amt -= pay;
            }
        }
    }

    // 準備結果文字（原有顯示 + 新增定向配對顯示）
    let text = "----- 結算 -----\n";
    for (let p in balance) text += p + " : " + (Math.floor(balance[p] * 100) / 100).toFixed(2) + "\n";

    text += "\n----- 派對分攤明細 -----\n";
    let sortedParty = party.slice().sort(function(a, b) {
        const ca = (a.cat || '').toString();
        const cb = (b.cat || '').toString();
        let cmp = ca.localeCompare(cb, 'zh-Hant-TW');
        if (cmp !== 0) return cmp;
        return (a.item || '').toString().localeCompare((b.item || ''), 'zh-Hant-TW');
    });
    for (let i = 0; i < sortedParty.length; i++) {
        let it = sortedParty[i];
        let members = it.members && it.members.length ? it.members : people.slice();
        let per = Math.floor((it.price / members.length) * 100) / 100;
        text += `${it.cat || ''} ${it.item} : ${(Math.floor(it.price * 100) / 100).toFixed(2)} / ${members.length}人 = ${per.toFixed(2)} 每人\n`;
    }

    text += "\n----- 個人費用 -----\n";
    for (let person of people) {
        if ((personalTotals[person] || 0) > 0) text += `${person} : ${(Math.floor(personalTotals[person] * 100) / 100).toFixed(2)}\n`;
    }

    text += "\n----- 原始代付 -----\n";
    for (let person of people) {
        if ((advancePaidMap[person] || 0) > 0) text += `${person} 代付 : ${(Math.floor(advancePaidMap[person] * 100) / 100).toFixed(2)}\n`;
    }

    if (consolidateAdvance && primaryPayer) {
        let totalTransferredToPrimary = 0;
        for (let person of people) {
            if (person !== primaryPayer) totalTransferredToPrimary += (advancePaidMap[person] || 0);
        }
        if (totalTransferredToPrimary > 0) text += `\n（合併代付）主要付錢人：${primaryPayer} ，其他人代付總和 = ${(Math.floor(totalTransferredToPrimary * 100) / 100).toFixed(2)}\n`;
    }

    // 計算每人「應付代付」：依每筆 advance 的 members 平均分攤，若合併模式則分攤對象為主要付錢人，否則為原代付人
    let advanceShareOwed = {};
    for (let p of people) advanceShareOwed[p] = 0;
    for (let i = 0; i < advance.length; i++) {
        let a = advance[i];
        if (!a || (Number(a.price) || 0) === 0) return;
        let members = (a.members && a.members.length) ? a.members : people.slice();
        if (!members || members.length === 0) continue;
        let per = Math.floor(((Number(a.price) || 0) / members.length) * 100) / 100;
        // 合併時所有人的代付視為要還給主要付錢人
        let recipient = (consolidateAdvance && primaryPayer) ? primaryPayer : a.person;
        for (let m of members) {
            // 若是受款人（主要付錢人或原代付者）則不算在應付清單
            if (m === recipient) continue;
            if (typeof advanceShareOwed[m] !== 'undefined') advanceShareOwed[m] += per;
        }
    }

    // 只顯示「大項目」與金額，並加入「應付代付」欄位（僅顯示此人依代付分攤應付的金額）
    text += "\n----- 個人計算步驟（僅顯示大項目） -----\n";
    for (let person of people) {
        let partyShare = partyShareMap[person] || 0;
        let personalAmt = personalTotals[person] || 0;
        let advPaid = advancePaidMap[person] || 0;
        let advReceived = 0;
        if (consolidateAdvance && primaryPayer && person === primaryPayer) {
            let totalT = 0;
            for (let q of people) if (q !== primaryPayer) totalT += (advancePaidMap[q] || 0);
            advReceived = totalT;
        }
        let owed = advanceShareOwed[person] || 0;
        // 計算每人總價（此處定義為：派對分攤 + 個人費用 + 應付代付）
        let totalDue = Math.floor(((partyShare || 0) + (personalAmt || 0) + (owed || 0)) * 100) / 100;
        let line = `${person} : 派對 ${(Math.floor(partyShare * 100) / 100).toFixed(2)} , 個人 ${(Math.floor(personalAmt * 100) / 100).toFixed(2)} , 自己代付 ${(Math.floor(advPaid * 100) / 100).toFixed(2)}`;
        if (advReceived > 0) {
            line += ` , 收到代付 ${(Math.floor(advReceived * 100) / 100).toFixed(2)}`;
        }
        line += ` , 應付代付 ${(Math.floor(owed * 100) / 100).toFixed(2)}`;
        // 新增：顯示每人的總價
        line += ` , 總價 ${(totalDue).toFixed(2)}`;
        text += line + "\n";
    }
    text += "\n(※ 上方「應付代付」為各人依代付分攤應付之合計；下方「個人費用細項」為逐項合併/抵扣後的結果)\n";

    // 顯示定向配對（合併同一債務人→同一付款人的多筆項目，並列出每項及合計）
    if (Object.keys(directedMap).length > 0) {
        // 先把 directedMap 的雙向條目（A->B 與 B->A）合併並互相抵銷 (netting)
        // 建立以 pairKey (sorted names) 為單位的聚合物件
        // pairAgg[key] = { a, b, items: [ {desc, amt_signed, type} ], total: signedSum }
        let pairAgg = {};
        for (let debtor in directedMap) {
            for (let payer in directedMap[debtor]) {
                let entry = directedMap[debtor][payer];
                let names = [debtor, payer].slice().sort();
                let key = names.join('||');
                if (!pairAgg[key]) pairAgg[key] = { a: names[0], b: names[1], items: [], total: 0 };

                // 這個 direction 是 debtor -> payer
                let sign = (debtor === pairAgg[key].a) ? 1 : -1; // 若 debtor 為 a，表示加正；若 debtor 為 b，表示為負
                for (let it of entry.items) {
                    let desc = (it.desc || '').trim();
                    let amt = Math.floor((Number(it.amt) || 0) * 100) / 100;
                    // push item with sign and preserve type
                    pairAgg[key].items.push({ desc: desc, amt: sign * amt, type: it.type || 'personal' });
                    pairAgg[key].total += sign * amt;
                }
            }
        }

        // 顯示合併後結果：若 net 為正，顯示 a -> b；若負則顯示 b -> a，並列出每項的淨額（依類型排序：派對>個人>代出）
        // 我們改以 HTML 表格呈現「個人費用細項」，並保留先前的純文字摘要在上方

        // 類型排序權重（數字愈小愈先顯示）
        const typeOrder = { 'party': 0, 'personal': 1, 'advance': 2 };

        // 建立表格 HTML（標頭）
        let detailTableHtml = '<div style="margin-top:12px;">';
        detailTableHtml += '<h3 style="margin:6px 0 8px 0;">個人費用細項（表格）</h3>';
        detailTableHtml += '<div style="overflow:auto;border:1px solid #e6e9ee;border-radius:8px;padding:6px;background:#fff;">';
        detailTableHtml += '<table style="width:100%;border-collapse:collapse;"><thead><tr>' +
            '<th style="padding:8px;border-bottom:1px solid #eef2f6;">債務人</th>' +
            '<th style="padding:8px;border-bottom:1px solid #eef2f6;">收款人</th>' +
            '<th style="padding:8px;border-bottom:1px solid #eef2f6;">類型</th>' +
            '<th style="padding:8px;border-bottom:1px solid #eef2f6;">品項說明</th>' +
            '<th style="padding:8px;border-bottom:1px solid #eef2f6; text-align:right;">金額</th>' +
            '</tr></thead><tbody>';

        // 先排序 pairAgg 的鍵以穩定輸出順序（依人名排序）
        const pairKeys = Object.keys(pairAgg).sort((a,b) => a.localeCompare(b, 'zh-Hant-TW'));

        for (let pk of pairKeys) {
            let node = pairAgg[pk];
            // 合併同樣 desc & type 的項目
            const merged = {};
            for (let it of node.items) {
                const keyDesc = (it.type || '') + '||' + it.desc;
                merged[keyDesc] = (merged[keyDesc] || 0) + it.amt;
            }

            // 轉成陣列並過濾 0
            let partsArr = Object.keys(merged)
                .map(k => {
                    const [t, d] = k.split('||');
                    return { desc: d, amt: Math.floor(merged[k] * 100) / 100, type: t };
                })
                .filter(x => x.amt !== 0)
                // 依 typeOrder 再依絕對值大小排序
                .sort((x, y) => {
                    const to = (typeOrder[x.type] || 99) - (typeOrder[y.type] || 99);
                    if (to !== 0) return to;
                    return Math.abs(y.amt) - Math.abs(x.amt);
                });

            let net = Math.floor(node.total * 100) / 100;
            let from = net >= 0 ? node.a : node.b;
            let to = net >= 0 ? node.b : node.a;
            let absNet = Math.abs(net);

            if (partsArr.length === 0) {
                // 顯示一列說明（已抵銷）
                detailTableHtml += `<tr><td style="padding:8px;border-bottom:1px solid #eef2f6;">${escapeHtml(from)}</td><td style="padding:8px;border-bottom:1px solid #eef2f6;">${escapeHtml(to)}</td><td style="padding:8px;border-bottom:1px solid #eef2f6;">--</td><td style="padding:8px;border-bottom:1px solid #eef2f6;">已抵銷項目</td><td style="padding:8px;border-bottom:1px solid #eef2f6;text-align:right;">${absNet.toFixed(2)}</td></tr>`;
            } else {
                // 每個 partsArr 條目分別為一列
                for (let pa of partsArr) {
                    const typeLabel = (pa.type === 'party') ? '派對費用' : (pa.type === 'personal') ? '個人費用' : '代出費用';
                    detailTableHtml += `<tr><td style="padding:8px;border-bottom:1px solid #eef2f6;">${escapeHtml(from)}</td><td style="padding:8px;border-bottom:1px solid #eef2f6;">${escapeHtml(to)}</td><td style="padding:8px;border-bottom:1px solid #eef2f6;">${typeLabel}</td><td style="padding:8px;border-bottom:1px solid #eef2f6;">${escapeHtml(pa.desc)}</td><td style="padding:8px;border-bottom:1px solid #eef2f6;text-align:right;">${pa.amt.toFixed(2)}</td></tr>`;
                }
                // 加入該 pair 的合計列
                detailTableHtml += `<tr style="background:#fafafa;"><td colspan="4" style="padding:8px;border-bottom:1px solid #eef2f6; text-align:right; font-weight:700;">小計 ${escapeHtml(from)} → ${escapeHtml(to)}</td><td style="padding:8px;border-bottom:1px solid #eef2f6;text-align:right; font-weight:700;">${absNet.toFixed(2)}</td></tr>`;
            }
        }

        detailTableHtml += '</tbody></table></div></div>';
    }

    // 列出配對結束後仍有剩餘的債務或債權（未分配）
    let remainingLines = [];
    for (let i = 0; i < debtors.length; i++) {
        if (debtors[i].amt > 0) remainingLines.push(debtors[i].p + " 尚欠 " + (Math.floor(debtors[i].amt * 100) / 100).toFixed(2));
    }
    for (let i = 0; i < creditors.length; i++) {
        if (creditors[i].amt > 0) remainingLines.push(creditors[i].p + " 尚收 " + (Math.floor(creditors[i].amt * 100) / 100).toFixed(2));
    }

    // 把純文字摘要放在 <pre>，並在下方附上結構化表格（若有）以提升可讀性
    try {
        result.innerHTML = '<div style="margin-bottom:12px;"><pre style="white-space:pre-wrap;margin:0;">' + escapeHtml(text) + '</pre></div>' + (typeof detailTableHtml !== 'undefined' ? detailTableHtml : '');
    } catch (e) {
        // 若因某種原因無法使用 innerHTML（理論上不會發生），回退到 textContent
        result.textContent = text;
    }
}

function exportLine() {
    // 重新計算並複製整份結果文字到剪貼簿（支援 navigator.clipboard 與 fallback）
    calculate();
    const text = result.textContent || '';
    if (!text) {
        alert('無可複製內容');
        return;
    }
    // 先嘗試使用現代 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
            alert('已複製全部文字');
        }).catch(function (err) {
            // 若失敗，使用 fallback
            fallbackCopyText(text);
        });
    } else {
        // fallback
        fallbackCopyText(text);
    }
    function fallbackCopyText(str) {
        const ta = document.createElement('textarea');
        ta.value = str;
        // 避免影響頁面布局
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try {
            const ok = document.execCommand('copy');
            if (ok) {
                alert('已複製全部文字');
            } else {
                alert('複製失敗，請手動複製文字');
            }
        } catch (e) {
            alert('複製失敗，請手動複製文字');
        }
        document.body.removeChild(ta);
    }
}

function resetAll() {
    if (!confirm("確定清空?")) {
        return;
    }
    people = [];
    party = [];
    personal = [];
    advance = [];
    save();
    render();
    clearResult();
}

function onGroupPersonChange(el) {
    let val = el.value;
    if (el.checked) {
        if (!groupSelectedPeople.includes(val)) groupSelectedPeople.push(val);
    } else {
        groupSelectedPeople = groupSelectedPeople.filter(p => p !== val);
    }
}

function groupPeople() {
    clearResult();
    let name = groupName.value.trim();
    if (!name) {
        alert('請輸入群組名稱');
        return;
    }
    // 修正: 用 groupSelectedPeople 取得已勾選人員
    let selected = groupSelectedPeople.slice();
    if (selected.length === 0) {
        alert('請至少選擇一位成員');
        return;
    }
    groups.push({ name: name, members: selected });
    groupName.value = '';
    groupSelectedPeople = [];
    save();
    render();
}

// 群組選定人全清除
function clearGroupSelection() {
    clearResult();
    groupSelectedPeople = [];
    save();
    render();
}

function editGroup(idx) {
    editGroupIndex = idx;
    render();
}

function toggleGroupMember(groupIdx, person) {
    clearResult();
    let group = groups[groupIdx];
    let idx = group.members.indexOf(person);
    if (idx >= 0) {
        group.members.splice(idx, 1);
    } else {
        group.members.push(person);
    }
    render();
}

function saveGroupEdit() {
    save();
    editGroupIndex = null;
    render();
}

function cancelGroupEdit() {
    editGroupIndex = null;
    render();
}

function deleteGroup(idx) {
    if (!confirm('確定要刪除這個群組嗎？')) return;
    groups.splice(idx, 1);
    save();
    render();
}

// 新增解析模式狀態與手動列暫存
let parseMode = localStorage.parseMode || 'auto'; // 'auto' or 'manual'
let manualRows = []; // {cat, item, price, membersCsv, type}

// 將現有 party / personal / advance 資料組成 manualRows（供一般模式編輯）
function buildManualRowsFromData() {
    const rows = [];
    // 派對項目（保留 cat, item, price, membersCsv）
    for (let p of party) {
        rows.push({
            cat: p.cat || '',
            item: p.item || '',
            price: p.price || '',
            membersCsv: (p.members && p.members.length) ? p.members.join(',') : '',
            type: 'party'
        });
    }
    // 個人費用（membersCsv 第一個為 person）
    for (let it of personal) {
        rows.push({
            cat: '',
            item: it.item || '',
            price: it.price || '',
            membersCsv: it.person || '',
            type: 'personal'
        });
    }
    // 代付（membersCsv 第一個放代付人，之後為分攤成員；與 saveManualRows 的解析邏輯相容）
    for (let a of advance) {
        let members = (a.members && a.members.length) ? a.members.slice() : people.slice();
        let membersCsv = '';
        if (a.person) {
            // 若 members 包含代付人，保留順序但不重複
            const uniqueMembers = [a.person].concat(members.filter(m => m !== a.person));
            membersCsv = uniqueMembers.join(',');
        } else {
            membersCsv = members.join(',');
        }
        rows.push({
            cat: '',
            item: a.item || '',
            price: a.price || '',
            membersCsv: membersCsv,
            type: 'advance'
        });
    }
    // 若沒有任何項目，保留一列空白可編輯
    if (rows.length === 0) rows.push({ cat: '', item: '', price: '', membersCsv: '', type: 'party' });
    manualRows = rows;
}

// 切換模式
function toggleParseMode() {
    parseMode = (parseMode === 'auto') ? 'manual' : 'auto';
    localStorage.parseMode = parseMode;
    updateParseModeUI();

    // 當切到一般模式時，將現有 party / personal / advance 資料帶入 manualRows（可編輯）
    if (parseMode === 'manual') {
        buildManualRowsFromData();
        renderManualRows();
    }
}

function updateParseModeUI() {
    const autoBox = document.getElementById('autoParseBox');
    const manualBox = document.getElementById('manualParseBox');
    const btn = document.getElementById('toggleParseModeBtn');
    if (parseMode === 'manual') {
        autoBox.style.display = 'none';
        manualBox.style.display = '';
        btn.textContent = '切換到自動模式';
    } else {
        autoBox.style.display = '';
        manualBox.style.display = 'none';
        btn.textContent = '切換到一般模式';
    }
}

// 渲染 manualRows 到 DOM
function renderManualRows() {
    const tbody = document.getElementById('manualRowsBody');
    tbody.innerHTML = '';
    for (let i = 0; i < manualRows.length; i++) {
        const r = manualRows[i];
        const tr = document.createElement('tr');
        // 使用模板字面量避免複雜跳脫與拼接錯誤
        tr.innerHTML = `
            <td style="border:1px solid #ccc; padding:6px;">
                <input type="text" value="${escapeHtml(r.cat)}" onchange="manualRowChange(${i}, 'cat', this.value)">
            </td>
            <td style="border:1px solid #ccc; padding:6px;">
                <input type="text" value="${escapeHtml(r.item)}" onchange="manualRowChange(${i}, 'item', this.value)">
            </td>
            <td style="border:1px solid #ccc; padding:6px;">
                <input type="number" value="${escapeHtml(r.price)}" onchange="manualRowChange(${i}, 'price', this.value)">
            </td>
            <td style="border:1px solid #ccc; padding:6px;">
                <input type="text" value="${escapeHtml(r.membersCsv)}" onchange="manualRowChange(${i}, 'membersCsv', this.value)" placeholder="例如: 小明,小華">
            </td>
            <td style="border:1px solid #ccc; padding:6px;">
                <select onchange="manualRowChange(${i}, 'type', this.value)">
                    <option value="party" ${r.type === 'party' ? 'selected' : ''}>派對費用</option>
                    <option value="personal" ${r.type === 'personal' ? 'selected' : ''}>個人費用</option>
                    <option value="advance" ${r.type === 'advance' ? 'selected' : ''}>代出費用</option>
                </select>
            </td>
            <td style="border:1px solid #ccc; padding:6px; text-align:center;">
                <button onclick="removeManualRow(${i})" class="btn">刪除</button>
            </td>
        `;
        tbody.appendChild(tr);
    }
    updateAddRowButtonState();
}

function manualRowChange(idx, key, val) {
    manualRows[idx][key] = val;
    // 即時變動會影響計算，清空結果提示使用者須重新計算
    clearResult();
}

function addManualRow() {
    clearResult();
    if (manualRows.length >= 50) { alert('最多可新增50列'); return; }
    manualRows.push({ cat: '', item: '', price: '', membersCsv: '', type: 'party' });
    renderManualRows();
}

function removeManualRow(idx) {
    clearResult();
    manualRows.splice(idx, 1);
    if (manualRows.length === 0) manualRows.push({ cat: '', item: '', price: '', membersCsv: '', type: 'party' });
    renderManualRows();
}

function saveManualRows() {
    clearResult();
    // 驗證並依類型寫回相對應陣列（派對費用直接替換，個人/代出直接覆蓋）
    const newParty = [];
    const newPersonal = [];
    const newAdvance = [];
    for (let i = 0; i < manualRows.length; i++) {
        const r = manualRows[i];
        if ((!r.cat || r.cat.trim() === '') && (!r.item || r.item.trim() === '') && (!r.price || r.price === '') && (!r.membersCsv || r.membersCsv.trim() === '')) {
            // skip 全空列
            continue;
        }
        const priceVal = r.price === '' ? 0 : Math.round(Number(r.price));
        const members = (r.membersCsv && r.membersCsv.trim() !== '') ? r.membersCsv.split(/[\s,，]+/).map(s => s.trim()).filter(Boolean) : people.slice();

        if (!r.type || r.type === 'party') {
            // 派對費用：members 作為分攤對象
            newParty.push({
                cat: r.cat || '未分類',
                item: r.item || '',
                price: priceVal,
                payer: primaryPayer || '', // 預設付款人帶入主要付錢人（若有）
                members: members
            });
        } else if (r.type === 'personal') {
            // 個人費用：membersCsv 的第一個當成 person（若空就跳過）
            const person = members.length ? members[0] : null;
            if (person) {
                newPersonal.push({
                    person: person,
                    item: r.item || '',
                    price: priceVal,
                    payer: primaryPayer || person // 若有主要付錢人則預設為主要付錢人，否則為本人
                });
            }
        } else if (r.type === 'advance') {
            // 代出費用：membersCsv 的第一個當成代付人（若空就跳過）
            const person = members.length ? members[0] : null;
            if (person) {
                newAdvance.push({
                    person: person,
                    item: r.item || '',
                    price: priceVal,
                    members: (members.length ? members : people.slice()), // 若有指定則用，否則預設全部
                    custom: false
                });
            }
        }
    }

    // 派對/個人/代出都直接覆蓋，避免重複
    party = newParty;
    personal = newPersonal;
    advance = newAdvance;

    save();
    render();
    alert('已儲存（派對/個人/代出費用）');
}

// 控制新增列按鈕狀態
function updateAddRowButtonState() {
    const btn = document.querySelector('#manualParseBox button[onclick="addManualRow()"]');
    if (!btn) return;
    btn.disabled = manualRows.length >= 50;
}

// escapeHtml 簡單函式避免注入
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// 頁面載入時更新 UI 狀態
(function initParseMode() {
    if (!localStorage.parseMode) localStorage.parseMode = 'auto';
    parseMode = localStorage.parseMode || 'auto';
    updateParseModeUI();
    if (parseMode === 'manual') {
        // 預先將現有 party/personal/advance 帶入以便編輯
        buildManualRowsFromData();
        renderManualRows();
    }
})();

// 若 localStorage 有主要付錢人，先把未指定的付款人帶入預設
applyPrimaryPayerDefaults();
render();