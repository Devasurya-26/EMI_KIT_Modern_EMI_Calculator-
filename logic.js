let tenureMode = 'yr';
        let showAllRows = false;

        function setTenureMode(mode) {
            tenureMode = mode;
            document.getElementById('yrBtn').classList.toggle('active', mode === 'yr');
            document.getElementById('moBtn').classList.toggle('active', mode === 'mo');
            const slider = document.getElementById('tenure');
            if (mode === 'yr') {
                slider.min = 1; slider.max = 30; slider.step = 1;
                if (slider.value > 30) slider.value = 30;
            } else {
                slider.min = 6; slider.max = 360; slider.step = 6;
                if (slider.value < 6) slider.value = 6;
            }
            updateAll();
        }

        function fmt(n) {
            return '₹' + Math.round(n).toLocaleString('en-IN');
        }

        function calcEMI(P, annualRate, months) {
            const r = annualRate / 12 / 100;
            if (r === 0) return P / months;
            return P * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
        }

        function updateAll() {
            const P = parseFloat(document.getElementById('loanAmt').value);
            const annualRate = parseFloat(document.getElementById('rate').value);
            let months = parseInt(document.getElementById('tenure').value);
            if (tenureMode === 'yr') months = months * 12;

            const emi = calcEMI(P, annualRate, months);
            const total = emi * months;
            const interest = total - P;

            document.getElementById('loanAmtLabel').textContent = fmt(P);
            document.getElementById('rateLabel').textContent = annualRate.toFixed(1) + '% p.a.';
            const displayTenure = tenureMode === 'yr'
                ? document.getElementById('tenure').value + ' Years'
                : document.getElementById('tenure').value + ' Months';
            document.getElementById('tenureLabel').textContent = displayTenure;

            document.getElementById('emiAmt').textContent = fmt(emi);
            document.getElementById('emiSubtext').textContent = 'for ' + months + ' months';
            document.getElementById('principalAmt').textContent = fmt(P);
            document.getElementById('interestAmt').textContent = fmt(interest);
            document.getElementById('totalAmt').textContent = fmt(total);

            const pp = Math.round(P / total * 100);
            const ip = 100 - pp;
            document.getElementById('lgPrincipal').innerHTML = fmt(P) + ' <span class="l-pct">(' + pp + '%)</span>';
            document.getElementById('lgInterest').innerHTML = fmt(interest) + ' <span class="l-pct">(' + ip + '%)</span>';

            drawPie(P, interest);
            buildTable(P, annualRate, months, emi);
        }

        function drawPie(principal, interest) {
            const canvas = document.getElementById('pieChart');
            const ctx = canvas.getContext('2d');
            const W = canvas.width, H = canvas.height;
            const cx = W / 2, cy = H / 2, r = 68, innerR = 38;
            ctx.clearRect(0, 0, W, H);

            const total = principal + interest;
            const pAngle = (principal / total) * 2 * Math.PI;
            const iAngle = 2 * Math.PI - pAngle;
            const gap = 0.04;

            // Principal slice
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, -Math.PI / 2 + gap, -Math.PI / 2 + pAngle - gap);
            ctx.closePath();
            ctx.fillStyle = '#1a3a5c';
            ctx.fill();

            // Interest slice
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, -Math.PI / 2 + pAngle + gap, -Math.PI / 2 + 2 * Math.PI - gap);
            ctx.closePath();
            ctx.fillStyle = '#e8500a';
            ctx.fill();

            // Donut hole
            ctx.beginPath();
            ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            // Center text
            ctx.textAlign = 'center';
            ctx.fillStyle = '#0f0e0d';
            ctx.font = '700 13px Syne, sans-serif';
            ctx.fillText(Math.round(interest / total * 100) + '%', cx, cy - 4);
            ctx.font = '400 9px DM Mono, monospace';
            ctx.fillStyle = '#7a7570';
            ctx.fillText('INTEREST', cx, cy + 10);
        }

        function buildTable(P, annualRate, months, emi) {
            const tbody = document.getElementById('amortTable');
            tbody.innerHTML = '';
            const r = annualRate / 12 / 100;
            let balance = P;
            const years = Math.ceil(months / 12);
            const maxShow = showAllRows ? years : Math.min(5, years);

            for (let y = 1; y <= maxShow; y++) {
                let yearPrincipal = 0, yearInterest = 0;
                const openBal = balance;
                const mStart = (y - 1) * 12 + 1;
                const mEnd = Math.min(y * 12, months);

                for (let m = mStart; m <= mEnd; m++) {
                    const interestPart = balance * r;
                    const principalPart = emi - interestPart;
                    yearInterest += interestPart;
                    yearPrincipal += principalPart;
                    balance -= principalPart;
                    if (balance < 0) balance = 0;
                }

                const interestPct = Math.round(yearInterest / (yearInterest + yearPrincipal) * 100);
                const tr = document.createElement('tr');
                tr.innerHTML = `
      <td>${y}</td>
      <td>${fmt(openBal)}</td>
      <td class="principal-col">${fmt(yearPrincipal)}</td>
      <td class="interest-col">${fmt(yearInterest)}</td>
      <td>${fmt((mEnd - mStart + 1) * emi)}</td>
      <td>${fmt(Math.max(0, balance))}</td>
      <td>
        <div class="mini-bar"><div class="mini-bar-fill" style="width:${interestPct}%"></div></div>
        <div style="font-size:0.65rem;color:var(--muted);margin-top:2px;text-align:right">${interestPct}%</div>
      </td>
    `;
                tbody.appendChild(tr);
            }

            const btn = document.getElementById('showMoreBtn');
            if (years <= 5) {
                btn.style.display = 'none';
            } else {
                btn.style.display = 'inline-block';
                btn.textContent = showAllRows ? 'Show Less ↑' : 'Show All ' + years + ' Years ↓';
            }
        }

        function toggleTable() {
            showAllRows = !showAllRows;
            updateAll();
        }

        // Sync sliders and number inputs
        function syncInputs(sliderId, numId) {
            const slider = document.getElementById(sliderId);
            const num = document.getElementById(numId);
            slider.addEventListener('input', () => { num.value = slider.value; updateAll(); });
            num.addEventListener('input', () => {
                let v = parseFloat(num.value);
                if (!isNaN(v)) { slider.value = v; updateAll(); }
            });
        }

        syncInputs('loanAmt', 'loanAmtNum');
        syncInputs('rate', 'rateNum');
        document.getElementById('tenure').addEventListener('input', updateAll);

        updateAll();