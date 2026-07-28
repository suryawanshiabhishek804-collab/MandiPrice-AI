// MandiPrice AI Dashboard Javascript Engine

document.addEventListener("DOMContentLoaded", function () {
    // Initialize AOS animations
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-out',
            once: true
        });
    }

    // --- 1. Loading Animation Overlay Handling ---
    const form = document.getElementById("predictorForm");
    if (form) {
        form.addEventListener("submit", function (e) {
            if (!form.dataset.ready) {
                e.preventDefault();
                const overlay = document.getElementById("loadingOverlay");
                if (overlay) {
                    overlay.style.display = "flex";
                }

                const steps = [
                    document.getElementById("step1"),
                    document.getElementById("step2"),
                    document.getElementById("step3"),
                    document.getElementById("step4")
                ];

                let stage = 0;
                const stepInterval = setInterval(() => {
                    if (stage < steps.length) {
                        // Mark current step completed
                        steps[stage].className = "step-item completed";
                        steps[stage].querySelector(".step-icon").innerHTML = '<i class="fa-solid fa-circle-check"></i>';
                        stage++;
                        
                        // Mark next step active
                        if (stage < steps.length) {
                            steps[stage].className = "step-item active";
                            steps[stage].querySelector(".step-icon").innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                        }
                    } else {
                        clearInterval(stepInterval);
                        form.dataset.ready = "true";
                        form.submit();
                    }
                }, 550); // Speed transition
            }
        });
    }

    // Check if we have prediction data from Flask
    const data = window.JINJA_DATA || {};
    if (data.hasPrediction && data.predictedPrice) {
        // Scroll to prediction output smoothly after page reload
        const anchor = document.getElementById("prediction-anchor");
        if (anchor) {
            setTimeout(() => {
                anchor.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 300);
        }

        // --- 2. Seeded Random Generator for Consistent Insights & Weather ---
        const seedStr = `${data.crop}-${data.state}-${data.district}`;
        const seededRandom = function() {
            let hash = 0;
            for (let i = 0; i < seedStr.length; i++) {
                hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
            }
            const x = Math.sin(hash++) * 10000;
            return x - Math.floor(x);
        };

        // Get single seeded float or range
        const randomVal = seededRandom();
        const randRange = (min, max) => min + seededRandom() * (max - min);

        // --- 3. Dynamic AI Recommendation Engine ---
        const averagePrice = data.cropAverages[data.crop] || Math.round(data.predictedPrice * 0.95);
        let recommendation = "HOLD STOCK";
        let recClass = "hold";
        let recBadgeClass = "rec-badge-hold";
        let recCardClass = "rec-card-hold";
        let descriptionText = "";

        if (data.predictedPrice > averagePrice * 1.05) {
            recommendation = "SELL NOW";
            recClass = "sell";
            recBadgeClass = "rec-badge-sell";
            recCardClass = "rec-card-sell";
            descriptionText = `Current predicted price of <strong>₹${data.predictedPrice}</strong> is <strong>${Math.round((data.predictedPrice / averagePrice - 1) * 100)}% above</strong> the seasonal baseline average (₹${averagePrice}). Mandi arrivals are tightening; selling immediate stock secures high margins before correction.`;
        } else if (data.predictedPrice < averagePrice * 0.95) {
            recommendation = "BUY NOW";
            recClass = "buy";
            recBadgeClass = "rec-badge-buy";
            recCardClass = "rec-card-buy";
            descriptionText = `Current predicted price is trading <strong>${Math.round((1 - data.predictedPrice / averagePrice) * 100)}% below</strong> the seasonal baseline average (₹${averagePrice}). Market supply is peaking, making it an optimal buyer's window to stock inventories.`;
        } else {
            recommendation = "HOLD STOCK";
            recClass = "hold";
            recBadgeClass = "rec-badge-hold";
            recCardClass = "rec-card-hold";
            descriptionText = `Current predicted price is stable (within <strong>±5% of baseline average ₹${averagePrice}</strong>). Standard trading volumes are advised. Storage of non-perishable stocks is recommended to leverage next month's demand recovery.`;
        }

        // Render recommendation card
        const recCard = document.getElementById("recommendationCard");
        const recBadgeContainer = document.getElementById("recBadgeContainer");
        const recDescription = document.getElementById("recDescription");

        if (recCard && recBadgeContainer && recDescription) {
            recCard.className = `recommendation-card ${recCardClass}`;
            recBadgeContainer.innerHTML = `<span class="rec-badge ${recBadgeClass}"><span class="rec-bullet-dot ${recClass}"></span>${recommendation}</span>`;
            recDescription.innerHTML = descriptionText;
        }

        // --- 4. Dynamic Weather Generator based on State climate baseline ---
        let baseTemp = 30;
        let baseHumidity = 50;
        let baseRain = 20;

        const stateLower = data.state.toLowerCase();
        if (stateLower.includes("rajasthan") || stateLower.includes("gujarat") || stateLower.includes("haryana")) {
            baseTemp = 36; baseHumidity = 32; baseRain = 8;
        } else if (stateLower.includes("kerala") || stateLower.includes("andaman") || stateLower.includes("tamil nadu") || stateLower.includes("goa")) {
            baseTemp = 28; baseHumidity = 80; baseRain = 68;
        } else if (stateLower.includes("himachal") || stateLower.includes("jammu") || stateLower.includes("uttarakhand")) {
            baseTemp = 18; baseHumidity = 55; baseRain = 30;
        }

        const currentTemp = Math.round(baseTemp + randRange(-4, 4));
        const currentHumidity = Math.round(Math.min(95, Math.max(10, baseHumidity + randRange(-12, 12))));
        const currentRainChance = Math.round(Math.min(99, Math.max(0, baseRain + randRange(-15, 15))));
        const currentWind = Math.round(10 + randRange(-6, 12));

        // Weather icon and description selectors
        let weatherCond = "Partly Cloudy";
        let weatherIconClass = "fa-cloud-sun";
        let weatherAlertText = "<i class='fa-solid fa-circle-check'></i> Normal weather conditions. Stable harvest transport logistics.";

        if (currentRainChance > 65) {
            weatherCond = "Rainy Showers";
            weatherIconClass = "fa-cloud-showers-heavy";
            weatherAlertText = "<i class='fa-solid fa-circle-exclamation' style='color:#ef4444;'></i> High risk of precipitation. Protect loaded trucks and storage bays.";
        } else if (currentRainChance > 35) {
            weatherCond = "Scattered Drizzle";
            weatherIconClass = "fa-cloud-sun-rain";
            weatherAlertText = "<i class='fa-solid fa-triangle-exclamation' style='color:#f59e0b;'></i> Humid skies. Avoid drying crops in open yards.";
        } else if (currentTemp > 34 && currentHumidity < 40) {
            weatherCond = "Clear and Sunny";
            weatherIconClass = "fa-sun";
            weatherAlertText = "<i class='fa-solid fa-sun' style='color:#f59e0b;'></i> Dry solar thermal conditions. Optimal window for immediate sun drying.";
        }

        document.getElementById("weatherTemp").innerText = `${currentTemp}°C`;
        document.getElementById("weatherCondition").innerText = weatherCond;
        document.getElementById("weatherHumidity").innerText = `${currentHumidity}%`;
        document.getElementById("weatherRain").innerText = `${currentRainChance}%`;
        document.getElementById("weatherWind").innerText = `${currentWind} km/h`;
        
        const weatherIcon = document.getElementById("weatherIcon");
        weatherIcon.className = `fa-solid ${weatherIconClass} weather-icon`;
        if (weatherIconClass === "fa-sun") {
            weatherIcon.style.background = "linear-gradient(135deg, #fef08a 0%, #ea580c 100%)";
            weatherIcon.style.webkitBackgroundClip = "text";
        } else if (weatherIconClass === "fa-cloud-showers-heavy") {
            weatherIcon.style.background = "linear-gradient(135deg, #93c5fd 0%, #1d4ed8 100%)";
            weatherIcon.style.webkitBackgroundClip = "text";
        }
        document.getElementById("weatherAlert").innerHTML = weatherAlertText;

        // --- 5. Generate Farmer Advisory Tips ---
        const tipsContainer = document.getElementById("tipsContainer");
        if (tipsContainer) {
            let tips = [];
            const margin = Math.round(randRange(10, 24));
            
            if (recommendation === "SELL NOW") {
                tips = [
                    {
                        title: "Sell in Segments",
                        desc: "Liquidate 70% of current inventory immediately. Hold remaining 30% to monitor premium spot pricing indices."
                    },
                    {
                        title: "Skip Warehousing Cost",
                        desc: "Prices are at a peak. Avoid cold storage overheads and directly dispatch stocks to market hubs."
                    },
                    {
                        title: "Projected Net Margins",
                        desc: `Estimated profit returns are sitting at a strong +${margin}% margin relative to local cultivation costs.`
                    }
                ];
            } else if (recommendation === "BUY NOW") {
                tips = [
                    {
                        title: "Procure and Stock Pile",
                        desc: "Excellent buy window. Traders and processors should fill up buffer inventories to lock in lower costs."
                    },
                    {
                        title: "Assess Moisture Quality",
                        desc: "Peak seasonal supply could lead to rushed packaging. Check moisture ratios before loading bulk stock."
                    },
                    {
                        title: "Mitigate Shortage Risk",
                        desc: "Forward-buy contracts now to shield processing operations from upcoming mid-season price recoveries."
                    }
                ];
            } else {
                tips = [
                    {
                        title: "Leverage Dry Storage",
                        desc: "Store stocks in ventilated spaces. Hold off selling for 2-3 weeks to avoid low baseline returns."
                    },
                    {
                        title: "Monitor Alternate Mandis",
                        desc: "Prices are steady locally, but checking neighboring district mandis might yield +4% price arbitrage."
                    },
                    {
                        title: "Plan Next Harvest Logistics",
                        desc: "Baseline prices are stable. Coordinate transport queues during mid-week to avoid heavy broker commissions."
                    }
                ];
            }

            tipsContainer.innerHTML = tips.map((t, idx) => `
                <div class="tip-item">
                    <div class="tip-number">${idx + 1}</div>
                    <div class="tip-content">
                        <h5>${t.title}</h5>
                        <p>${t.desc}</p>
                    </div>
                </div>
            `).join('');
        }

        // --- 6. Market Insights Generator ---
        const demandPct = Math.round(75 + seededRandom() * 20);
        const arrivalChange = Math.round(5 + seededRandom() * 15);
        const arrivalStatus = seededRandom() > 0.5 ? "lower" : "higher";

        document.getElementById("insightDemand").innerText = `Export volume requests for ${data.crop} have shifted by +${Math.round(randRange(5, 15))}% in primary terminal markets.`;
        document.getElementById("insightSupply").innerText = `Current week arrival loads inside ${data.district} yards are ${arrivalChange}% ${arrivalStatus} than the 3-year historical average.`;
        document.getElementById("insightSeason").innerText = `Historical cycle data places ${data.crop} near the transition phase from harvest peak into processing storage.`;
        document.getElementById("insightSentiment").innerText = `Mandi brokers and buying commission houses register a strong ${demandPct}% confidence rating for trade pricing.`;

        // --- 7. Chart.js Implementation (Deterministic Future Trends) ---
        const ctx = document.getElementById("priceTrendChart");
        if (ctx) {
            // Generate line indices: Yesterday, Today, Tomorrow (Predicted), Day +2, Day +3, Day +4, Next Week
            const todayPrice = Math.round(data.predictedPrice * (1 + (seededRandom() * 0.03 - 0.05)));
            const tomorrowPrice = data.predictedPrice; // tomorrow's prediction
            const day3Price = Math.round(data.predictedPrice * (1 + (seededRandom() * 0.04 - 0.02)));
            const day4Price = Math.round(data.predictedPrice * (1 + (seededRandom() * 0.04 - 0.01)));
            const day5Price = Math.round(data.predictedPrice * (1 + (seededRandom() * 0.03 - 0.015)));
            const day6Price = Math.round(data.predictedPrice * (1 + (seededRandom() * 0.05 - 0.02)));
            
            let nextWeekPrice = Math.round(data.predictedPrice * (1 + (seededRandom() * 0.08 - 0.03)));
            if (recommendation === "SELL NOW") {
                // Price is peaking, next week might correct slightly downwards
                nextWeekPrice = Math.round(data.predictedPrice * 0.96);
            } else if (recommendation === "BUY NOW") {
                // Price is low, next week might bounce back slightly
                nextWeekPrice = Math.round(data.predictedPrice * 1.04);
            }

            const chartLabels = ["Today", "Tomorrow (Pred)", "Day after", "3 Days Later", "4 Days Later", "5 Days Later", "Next Week"];
            const chartData = [todayPrice, tomorrowPrice, day3Price, day4Price, day5Price, day6Price, nextWeekPrice];

            // Create linear background gradient for line area fill
            const chartCtx = ctx.getContext("2d");
            const gradientFill = chartCtx.createLinearGradient(0, 0, 0, 240);
            gradientFill.addColorStop(0, "rgba(16, 185, 129, 0.3)");
            gradientFill.addColorStop(1, "rgba(16, 185, 129, 0.0)");

            new Chart(ctx, {
                type: "line",
                data: {
                    labels: chartLabels,
                    datasets: [{
                        label: `${data.crop} Price Index (₹/Qtl)`,
                        data: chartData,
                        borderColor: "#10b981",
                        borderWidth: 3,
                        pointBackgroundColor: "#34d399",
                        pointBorderColor: "#ffffff",
                        pointHoverRadius: 7,
                        pointRadius: 4,
                        fill: true,
                        backgroundColor: gradientFill,
                        tension: 0.4 // Smooth bezier curves
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: "rgba(15, 23, 42, 0.95)",
                            titleColor: "#ffffff",
                            bodyColor: "#34d399",
                            borderColor: "rgba(16, 185, 129, 0.3)",
                            borderWidth: 1,
                            padding: 12,
                            displayColors: false,
                            callbacks: {
                                label: function(context) {
                                    return `Price: ₹${context.parsed.y} / Qtl`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: "rgba(255, 255, 255, 0.05)"
                            },
                            ticks: {
                                color: "#94a3b8",
                                font: {
                                    size: 11
                                }
                            }
                        },
                        y: {
                            grid: {
                                color: "rgba(255, 255, 255, 0.05)"
                            },
                            ticks: {
                                color: "#94a3b8",
                                font: {
                                    size: 11
                                },
                                callback: function(value) {
                                    return "₹" + value;
                                }
                            }
                        }
                    }
                }
            });
        }

        // --- 8. Log Current Prediction to LocalStorage ---
        const historyLog = JSON.parse(localStorage.getItem("mandi_history")) || [];
        const timestamp = new Date().toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

        const currentEntry = {
            timestamp: timestamp,
            crop: data.crop,
            region: `${data.district}, ${data.state}`,
            price: data.predictedPrice,
            confidence: `${data.confidence}%`,
            recommendation: recommendation
        };

        // Prevent exact duplicate inserts from refresh
        let isDuplicate = false;
        if (historyLog.length > 0) {
            const last = historyLog[0];
            if (last.crop === currentEntry.crop && 
                last.region === currentEntry.region && 
                last.price === currentEntry.price) {
                isDuplicate = true;
            }
        }

        if (!isDuplicate) {
            historyLog.unshift(currentEntry);
            if (historyLog.length > 10) {
                historyLog.pop(); // Limit to 10 entries
            }
            localStorage.setItem("mandi_history", JSON.stringify(historyLog));
        }
    }

    // --- 9. Render Table History ---
    const historyTableBody = document.getElementById("historyTableBody");
    const clearHistoryBtn = document.getElementById("clearHistoryBtn");

    function renderHistory() {
        const historyLog = JSON.parse(localStorage.getItem("mandi_history")) || [];
        if (!historyTableBody) return;

        if (historyLog.length === 0) {
            historyTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-history">
                        <i class="fa-solid fa-folder-open"></i>
                        No previous predictions logged yet. Run a prediction above!
                    </td>
                </tr>
            `;
            if (clearHistoryBtn) clearHistoryBtn.style.display = "none";
        } else {
            if (clearHistoryBtn) clearHistoryBtn.style.display = "flex";
            historyTableBody.innerHTML = historyLog.map(entry => {
                let badgeClass = "status-badge-hold";
                if (entry.recommendation === "SELL NOW") badgeClass = "status-badge-sell";
                if (entry.recommendation === "BUY NOW") badgeClass = "status-badge-buy";

                return `
                    <tr>
                        <td style="color: #64748b; font-size: 0.85rem;">${entry.timestamp}</td>
                        <td style="font-weight: 700; color: #ffffff;">${entry.crop}</td>
                        <td>${entry.region}</td>
                        <td style="font-weight: 800; color: #ffffff;">₹${entry.price} / Qtl</td>
                        <td style="color: #34d399; font-weight: 600;">${entry.confidence}</td>
                        <td><span class="status-badge ${badgeClass}">${entry.recommendation}</span></td>
                    </tr>
                `;
            }).join('');
        }
    }

    renderHistory();

    // Clear history handler
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener("click", function () {
            if (confirm("Are you sure you want to clear your prediction history?")) {
                localStorage.removeItem("mandi_history");
                renderHistory();
            }
        });
    }
});
