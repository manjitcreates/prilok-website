// PRILOK BUILDING MATERIALS TRADING LLC - Application Logic (with Micro Animations & Open Source Previews)

document.addEventListener('DOMContentLoaded', () => {
    // Fast Micro Preloader Overlay Dismissal & Progress Animation
    const preloader = document.getElementById('page-preloader');
    const preloadBar = document.getElementById('preload-bar');
    const preloadPct = document.getElementById('preload-pct');
    if (preloader) {
        let pct = 0;
        const interval = setInterval(() => {
            pct += 25;
            const currentPct = Math.min(pct, 100);
            if (preloadBar) preloadBar.style.width = currentPct + '%';
            if (preloadPct) preloadPct.textContent = currentPct + '%';
            if (pct >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    preloader.style.opacity = '0';
                    setTimeout(() => preloader.style.display = 'none', 300);
                }, 100);
            }
        }, 30);
    }

    // Initialize Lucide Icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // Global Click Ripple Animation Effect
    document.addEventListener('click', (e) => {
        const target = e.target.closest('.add-rfq-btn, .cat-tab, #open-rfq-btn, button, a.px-5, a.px-6');
        if (target) {
            const rect = target.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'ripple-wave';
            ripple.style.left = `${e.clientX - rect.left}px`;
            ripple.style.top = `${e.clientY - rect.top}px`;
            target.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        }
    });

    // State Management
    let activeCategory = 'all';
    let searchQuery = '';
    let rfqCart = [];
    let attachedBoqFile = null;

    // UI Element References
    const categoryTabsContainer = document.getElementById('category-tabs');
    const materialsGrid = document.getElementById('materials-grid');
    const heroSearchInput = document.getElementById('hero-search-input');
    const searchBtn = document.getElementById('search-btn');
    const rfqBadge = document.getElementById('rfq-badge');
    const rfqModal = document.getElementById('rfq-modal');
    const openRfqBtn = document.getElementById('open-rfq-btn');
    const closeRfqBtn = document.getElementById('close-rfq-btn');
    const closeRfqBg = document.getElementById('close-rfq-bg');
    const rfqItemsContainer = document.getElementById('rfq-items-container');
    const clearRfqBtn = document.getElementById('clear-rfq-btn');
    const quickBoqBtn = document.getElementById('quick-boq-btn');
    const boqFileInput = document.getElementById('boq-file-input');
    const boqAttachedNote = document.getElementById('boq-attached-note');
    const submitRfqBtn = document.getElementById('submit-rfq-btn');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');

    const specsModal = document.getElementById('specs-modal');
    const specsModalContent = document.getElementById('specs-modal-content');
    const closeSpecsBtn = document.getElementById('close-specs-btn');
    const closeSpecsBg = document.getElementById('close-specs-bg');

    const brandFilterTabs = document.getElementById('brand-filter-tabs');
    const brandsGrid = document.getElementById('brands-grid');
    const industriesList = document.getElementById('industries-list');

    // 1. RENDER CATEGORY TABS
    function renderCategoryTabs() {
        if (!categoryTabsContainer) return;
        
        let html = `
            <button class="cat-tab px-4 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${activeCategory === 'all' ? 'bg-amber-500 text-navy-950 border-amber-400 shadow-md font-bold' : 'bg-navy-950 text-slate-300 border-slate-800 hover:border-slate-700'}" data-cat="all">
                All Materials (${PRILOK_DATA.materials.length})
            </button>
        `;

        PRILOK_DATA.categories.forEach(cat => {
            const count = PRILOK_DATA.materials.filter(m => m.categoryId === cat.id).length;
            const isActive = activeCategory === cat.id;
            html += `
                <button class="cat-tab px-4 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-2 active:scale-95 ${isActive ? 'bg-amber-500 text-navy-950 border-amber-400 shadow-md font-bold' : 'bg-navy-950 text-slate-300 border-slate-800 hover:border-slate-700'}" data-cat="${cat.id}">
                    <span>${cat.name}</span>
                    <span class="px-1.5 py-0.5 text-[10px] rounded-full ${isActive ? 'bg-navy-950 text-amber-400' : 'bg-slate-800 text-slate-400'}">${count}</span>
                </button>
            `;
        });

        categoryTabsContainer.innerHTML = html;

        // Add Click Handlers
        document.querySelectorAll('.cat-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const target = e.currentTarget;
                activeCategory = target.getAttribute('data-cat');
                renderCategoryTabs();
                renderMaterials();
            });
        });
    }

    // 2. RENDER MATERIALS GRID WITH IMAGE PREVIEW THUMBNAILS & MICRO-ANIMATIONS
    function renderMaterials() {
        if (!materialsGrid) return;

        let filtered = PRILOK_DATA.materials.filter(item => {
            const matchesCat = activeCategory === 'all' || item.categoryId === activeCategory;
            const query = searchQuery.toLowerCase().trim();
            const matchesSearch = !query || 
                item.name.toLowerCase().includes(query) ||
                item.items.some(i => i.toLowerCase().includes(query)) ||
                item.brands.some(b => b.toLowerCase().includes(query)) ||
                item.specs.toLowerCase().includes(query);
            return matchesCat && matchesSearch;
        });

        if (filtered.length === 0) {
            materialsGrid.innerHTML = `
                <div class="col-span-full py-16 text-center glass-card rounded-2xl p-8">
                    <i data-lucide="package-x" class="w-12 h-12 text-slate-500 mx-auto mb-3"></i>
                    <h3 class="text-lg font-bold text-white">No Matching Materials Found</h3>
                    <p class="text-xs text-slate-400 mt-1">Try clearing your search filters or browse by core category.</p>
                    <button id="reset-filter-btn" class="mt-4 px-4 py-2 rounded-lg bg-amber-500 text-navy-950 font-bold text-xs active:scale-95">Reset All Filters</button>
                </div>
            `;
            document.getElementById('reset-filter-btn')?.addEventListener('click', () => {
                activeCategory = 'all';
                searchQuery = '';
                if (heroSearchInput) heroSearchInput.value = '';
                renderCategoryTabs();
                renderMaterials();
            });
            if (window.lucide) lucide.createIcons();
            return;
        }

        materialsGrid.innerHTML = filtered.map(item => {
            const categoryObj = PRILOK_DATA.categories.find(c => c.id === item.categoryId);
            const inCart = rfqCart.find(cartItem => cartItem.id === item.id);

            return `
                <div class="glass-card rounded-2xl p-5 flex flex-col justify-between space-y-3 border border-slate-800 hover:border-amber-500/50 transition-all group overflow-hidden hover:-translate-y-1">
                    
                    <!-- PRODUCT IMAGE THUMBNAIL PREVIEW: CLEAN WHITE STUDIO STAGE -->
                    <div class="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 border border-slate-200 p-3 flex items-center justify-center cursor-pointer open-lightbox-trigger" data-id="${item.id}">
                        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent"></div>
                        
                        <img src="${item.image}?v=20260817_white_studio" alt="${item.name}" class="max-h-full max-w-full object-contain relative z-10 filter drop-shadow-[0_10px_20px_rgba(15,23,42,0.14)] group-hover:scale-105 transition-transform duration-500">
                        
                        <div class="absolute top-2 left-2 z-20">
                            <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-navy-950/90 text-amber-400 border border-slate-700/80 backdrop-blur-sm">
                                ${categoryObj ? categoryObj.name : 'MEP Material'}
                            </span>
                        </div>

                        <div class="absolute top-2 right-2 z-20">
                            <span class="flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm bg-emerald-950/90 text-emerald-400 border border-emerald-500/40">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1"></span>
                                In Stock UAE
                            </span>
                        </div>

                        <div class="absolute bottom-2 left-2 z-20">
                            <span class="text-[9px] font-mono font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800 uppercase tracking-widest">
                                ${item.id}
                            </span>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <h3 class="text-base font-bold text-white group-hover:text-amber-400 transition-colors leading-tight">${item.name}</h3>

                        <div class="text-xs text-slate-300 space-y-1 bg-navy-950/80 p-3 rounded-xl border border-slate-800/80">
                            <div class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Key Specifications & Items:</div>
                            <ul class="space-y-1">
                                ${item.items.slice(0, 3).map(i => `<li class="flex items-center"><i data-lucide="check" class="w-3 h-3 text-amber-400 mr-1.5 shrink-0"></i> <span>${i}</span></li>`).join('')}
                                ${item.items.length > 3 ? `<li class="text-[10px] text-amber-400 font-semibold pt-0.5">+ ${item.items.length - 3} more specifications...</li>` : ''}
                            </ul>
                        </div>

                        ${item.brands && item.brands.length ? `
                            <div class="flex flex-wrap items-center gap-1 text-[10px]">
                                <span class="text-slate-500">Brands:</span>
                                ${item.brands.map(b => `<span class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">${b}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>

                    <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <button class="view-specs-btn text-xs text-slate-400 hover:text-white font-semibold flex items-center active:scale-95" data-id="${item.id}">
                            <i data-lucide="eye" class="w-3.5 h-3.5 mr-1 text-blue-400"></i> View Specs
                        </button>

                        <button class="add-rfq-btn px-3.5 py-2 rounded-lg ${inCart ? 'bg-emerald-600 text-white' : 'bg-amber-500 hover:bg-amber-400 text-navy-950'} font-bold text-xs transition-all flex items-center shadow-md active:scale-95" data-id="${item.id}">
                            <i data-lucide="${inCart ? 'check-circle' : 'plus-circle'}" class="w-4 h-4 mr-1"></i>
                            <span>${inCart ? `In RFQ (${inCart.qty})` : 'Add to RFQ'}</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Attach event handlers
        document.querySelectorAll('.view-specs-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                openSpecsModal(id);
            });
        });

        document.querySelectorAll('.add-rfq-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                addToRfqCart(id);
            });
        });

        if (window.lucide) lucide.createIcons();
    }

    // 3. SPECS PREVIEW MODAL WITH FULL IMAGE PREVIEW
    function openSpecsModal(itemId) {
        const item = PRILOK_DATA.materials.find(m => m.id === itemId);
        if (!item || !specsModal || !specsModalContent) return;

        const categoryObj = PRILOK_DATA.categories.find(c => c.id === item.categoryId);

        specsModalContent.innerHTML = `
            <div class="relative h-48 w-full rounded-xl overflow-hidden mb-3 bg-navy-950 border border-slate-800">
                <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-navy-900 via-transparent to-transparent opacity-90"></div>
                <div class="absolute bottom-3 left-3 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider bg-navy-950/80 px-2.5 py-1 rounded border border-slate-700">
                    ${categoryObj ? categoryObj.name : 'Material Specification'}
                </div>
            </div>
            
            <h3 class="text-xl font-bold text-white">${item.name}</h3>
            
            <div class="p-3.5 rounded-xl bg-navy-950 border border-slate-800 space-y-1.5 text-xs">
                <div class="text-amber-400 font-semibold flex items-center">
                    <i data-lucide="shield-check" class="w-4 h-4 mr-1.5 text-emerald-400"></i> Technical Compliance & Standards:
                </div>
                <p class="text-slate-300 leading-relaxed">${item.specs}</p>
            </div>

            <div class="space-y-2 text-xs">
                <div class="font-semibold text-slate-300">Complete Sub-Item & Dimension List:</div>
                <div class="grid grid-cols-1 gap-1.5 bg-navy-950/60 p-3 rounded-xl border border-slate-800 max-h-36 overflow-y-auto">
                    ${item.items.map(i => `<div class="flex items-center text-slate-200"><i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-400 mr-2 shrink-0"></i> ${i}</div>`).join('')}
                </div>
            </div>

            ${item.brands && item.brands.length ? `
                <div class="text-xs space-y-1">
                    <span class="text-slate-400">Authorized Brands Supplied:</span>
                    <div class="flex flex-wrap gap-1.5 pt-1">
                        ${item.brands.map(b => `<span class="px-2.5 py-1 rounded bg-slate-800 text-amber-300 font-semibold border border-slate-700">${b}</span>`).join('')}
                    </div>
                </div>
            ` : ''}

            <div class="pt-2">
                <button class="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold text-xs transition-colors shadow-md flex items-center justify-center space-x-2 active:scale-95" onclick="window.addToRfqAndCloseModal('${item.id}')">
                    <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                    <span>Add ${item.name} to Project RFQ Basket</span>
                </button>
            </div>
        `;

        specsModal.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    }

    window.addToRfqAndCloseModal = (id) => {
        addToRfqCart(id);
        if (specsModal) specsModal.classList.add('hidden');
        openRfqModal();
    };

    if (closeSpecsBtn) closeSpecsBtn.addEventListener('click', () => specsModal.classList.add('hidden'));
    if (closeSpecsBg) closeSpecsBg.addEventListener('click', () => specsModal.classList.add('hidden'));

    // 4. RFQ CART MANAGEMENT
    function addToRfqCart(itemId) {
        const item = PRILOK_DATA.materials.find(m => m.id === itemId);
        if (!item) return;

        const existing = rfqCart.find(c => c.id === itemId);
        if (existing) {
            existing.qty += 1;
        } else {
            rfqCart.push({
                id: item.id,
                name: item.name,
                unit: item.stdUnit,
                qty: 1,
                notes: ''
            });
        }

        updateRfqBadge();
        renderMaterials();
        renderRfqModalItems();
    }

    function updateRfqBadge() {
        const total = rfqCart.reduce((sum, item) => sum + item.qty, 0);
        if (rfqBadge) rfqBadge.textContent = total;
    }

    function renderRfqModalItems() {
        if (!rfqItemsContainer) return;

        if (rfqCart.length === 0) {
            rfqItemsContainer.innerHTML = `
                <div class="p-6 rounded-xl bg-navy-950 border border-slate-800 text-center text-slate-400 text-xs py-8">
                    Your RFQ Basket is currently empty.<br>Browse the catalog and click <strong>"Add to RFQ"</strong>.
                </div>
            `;
            return;
        }

        rfqItemsContainer.innerHTML = rfqCart.map(item => `
            <div class="p-3.5 rounded-xl bg-navy-950 border border-slate-800 space-y-2 text-xs">
                <div class="flex items-center justify-between">
                    <span class="font-bold text-white">${item.name}</span>
                    <button class="remove-rfq-item text-rose-400 hover:text-rose-300 p-1 active:scale-95" data-id="${item.id}">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
                
                <div class="flex items-center justify-between pt-1">
                    <div class="text-slate-400 text-[11px]">Unit: <span class="text-slate-200">${item.unit}</span></div>
                    
                    <div class="flex items-center space-x-2">
                        <button class="qty-btn px-2 py-0.5 rounded bg-slate-800 text-white font-bold hover:bg-slate-700 active:scale-95" data-id="${item.id}" data-action="dec">-</button>
                        <span class="font-mono font-bold text-amber-400 text-sm px-1">${item.qty}</span>
                        <button class="qty-btn px-2 py-0.5 rounded bg-slate-800 text-white font-bold hover:bg-slate-700 active:scale-95" data-id="${item.id}" data-action="inc">+</button>
                    </div>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.remove-rfq-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                rfqCart = rfqCart.filter(i => i.id !== id);
                updateRfqBadge();
                renderMaterials();
                renderRfqModalItems();
            });
        });

        document.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const action = e.currentTarget.getAttribute('data-action');
                const cartItem = rfqCart.find(i => i.id === id);
                if (cartItem) {
                    if (action === 'inc') cartItem.qty += 1;
                    if (action === 'dec') {
                        cartItem.qty -= 1;
                        if (cartItem.qty <= 0) rfqCart = rfqCart.filter(i => i.id !== id);
                    }
                    updateRfqBadge();
                    renderMaterials();
                    renderRfqModalItems();
                }
            });
        });

        if (window.lucide) lucide.createIcons();
    }

    function openRfqModal() {
        renderRfqModalItems();
        if (rfqModal) rfqModal.classList.remove('hidden');
    }

    function closeRfqModal() {
        if (rfqModal) rfqModal.classList.add('hidden');
    }

    if (openRfqBtn) openRfqBtn.addEventListener('click', openRfqModal);
    if (closeRfqBtn) closeRfqBtn.addEventListener('click', closeRfqModal);
    if (closeRfqBg) closeRfqBg.addEventListener('click', closeRfqModal);
    if (quickBoqBtn) quickBoqBtn.addEventListener('click', openRfqModal);

    if (clearRfqBtn) {
        clearRfqBtn.addEventListener('click', () => {
            rfqCart = [];
            updateRfqBadge();
            renderMaterials();
            renderRfqModalItems();
        });
    }

    if (boqFileInput) {
        boqFileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                attachedBoqFile = e.target.files[0].name;
                if (boqAttachedNote) {
                    boqAttachedNote.textContent = `✓ Document attached: ${attachedBoqFile}`;
                    boqAttachedNote.classList.remove('hidden');
                }
            }
        });
    }

    // 5. PDF QUOTE GENERATOR
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', () => {
            if (rfqCart.length === 0 && !attachedBoqFile) {
                alert('Please add at least one material item or attach a BOQ file to generate a PDF quote preview.');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const companyName = document.getElementById('rfq-company')?.value || 'Client Enterprise Contracting';
            const personName = document.getElementById('rfq-person')?.value || 'Procurement Manager';
            const emirate = document.getElementById('rfq-emirate')?.value || 'Dubai';
            const urgency = document.getElementById('rfq-urgency')?.value || 'Standard Supply';

            // PDF Header
            doc.setFillColor(14, 59, 100);
            doc.rect(0, 0, 210, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.text('PRILOK BUILDING MATERIALS TRADING LLC', 14, 18);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Building Materials • MEP Materials • Industrial Supplies | UAE', 14, 26);
            doc.text('ESTIMATION & PROFORMA QUOTE INQUIRY', 14, 34);

            // Ref Info
            doc.setTextColor(30, 41, 59);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`RFQ Ref: PRK-RFQ-${Math.floor(100000 + Math.random() * 900000)}`, 14, 50);
            doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 140, 50);

            doc.setFont('helvetica', 'normal');
            doc.text(`Company / Client: ${companyName}`, 14, 58);
            doc.text(`Attention: ${personName}`, 14, 64);
            doc.text(`Delivery Location: ${emirate}, UAE`, 140, 58);
            doc.text(`Delivery SLA: ${urgency}`, 140, 64);

            if (attachedBoqFile) {
                doc.setTextColor(217, 130, 43);
                doc.text(`Attached BOQ File: ${attachedBoqFile}`, 14, 72);
                doc.setTextColor(30, 41, 59);
            }

            // Table Header
            let startY = attachedBoqFile ? 82 : 76;
            doc.setFillColor(241, 245, 249);
            doc.rect(14, startY, 182, 10, 'F');
            doc.setFont('helvetica', 'bold');
            doc.text('Item Description', 18, startY + 7);
            doc.text('Unit Standard', 110, startY + 7);
            doc.text('Qty', 145, startY + 7);
            doc.text('Estimated Rate (AED)', 162, startY + 7);

            // Items
            let currentY = startY + 16;
            doc.setFont('helvetica', 'normal');

            rfqCart.forEach((item, index) => {
                doc.text(`${index + 1}. ${item.name}`, 18, currentY);
                doc.text(item.unit, 110, currentY);
                doc.text(`${item.qty}`, 145, currentY);
                doc.text('Market Rate', 162, currentY);
                currentY += 8;
            });

            // Footer / Submittals Note
            currentY += 12;
            doc.setDrawColor(226, 232, 240);
            doc.line(14, currentY, 196, currentY);
            currentY += 8;

            doc.setFont('helvetica', 'italic');
            doc.setFontSize(9);
            doc.text('* Official itemized pricing with 5% UAE VAT will be dispatched within 4 hours by PRILOK sales team.', 14, currentY);
            doc.text('Contact hotline: +971 56 567 0169 | Email: sales@prilok.ae', 14, currentY + 6);

            doc.save(`PRILOK_RFQ_Quote_${companyName.replace(/\s+/g, '_')}.pdf`);
        });
    }

    if (submitRfqBtn) {
        submitRfqBtn.addEventListener('click', () => {
            if (rfqCart.length === 0 && !attachedBoqFile) {
                alert('Please add materials or attach a BOQ document.');
                return;
            }
            if (window.confetti) {
                confetti({
                    particleCount: 120,
                    spread: 80,
                    origin: { y: 0.6 }
                });
            }
            alert('✓ Thank you! Your RFQ has been submitted to PRILOK Sales Team. An engineer will contact you shortly with formal project pricing.');
            rfqCart = [];
            updateRfqBadge();
            renderMaterials();
            closeRfqModal();
        });
    }

    // 6. MEP CALCULATORS
    // A. Cable Tray Calculator
    const runCableCalc = document.getElementById('run-cable-calc');
    if (runCableCalc) {
        runCableCalc.addEventListener('click', () => {
            const qty = parseFloat(document.getElementById('calc-cable-qty').value) || 12;
            const dia = parseFloat(document.getElementById('calc-cable-dia').value) || 25;
            const spare = parseFloat(document.getElementById('calc-cable-spare').value) || 1.3;

            const reqWidth = Math.ceil((qty * dia * spare) / 50) * 50;
            const trayWidth = Math.max(reqWidth, 100);

            const resultBox = document.getElementById('cable-calc-result');
            const sizeVal = document.getElementById('cable-tray-size');
            if (resultBox && sizeVal) {
                sizeVal.textContent = `${trayWidth} mm (GI Heavy Duty)`;
                resultBox.classList.remove('hidden');
            }
        });
    }

    // B. Duct Weight Calculator
    const runDuctCalc = document.getElementById('run-duct-calc');
    if (runDuctCalc) {
        runDuctCalc.addEventListener('click', () => {
            const w = parseFloat(document.getElementById('calc-duct-w').value) || 600;
            const h = parseFloat(document.getElementById('calc-duct-h').value) || 400;
            const l = parseFloat(document.getElementById('calc-duct-l').value) || 50;
            const gauge = parseFloat(document.getElementById('calc-duct-gauge').value) || 22;

            let thickness = 0.85; // 22 gauge
            if (gauge === 24) thickness = 0.70;
            if (gauge === 20) thickness = 1.00;
            if (gauge === 18) thickness = 1.20;

            const perimeter = 2 * (w + h) / 1000;
            const area = perimeter * l;
            const weight = (area * thickness * 7.85 * 1.15).toFixed(1);

            const resultBox = document.getElementById('duct-calc-result');
            const weightVal = document.getElementById('duct-weight-val');
            const areaVal = document.getElementById('duct-area-val');
            if (resultBox && weightVal && areaVal) {
                weightVal.textContent = `${weight} kg`;
                areaVal.textContent = `${area.toFixed(1)} m² GI Sheet`;
                resultBox.classList.remove('hidden');
            }
        });
    }

    // C. Pipe Rating Calculator
    const runPipeCalc = document.getElementById('run-pipe-calc');
    if (runPipeCalc) {
        runPipeCalc.addEventListener('click', () => {
            const mat = document.getElementById('calc-pipe-mat').value;
            const press = parseFloat(document.getElementById('calc-pipe-press').value) || 16;
            const fluid = document.getElementById('calc-pipe-fluid').value;

            let rating = 'PN 16 (Class 150)';
            let note = 'Compliant with DIN / ASTM standard pressure specs.';

            if (mat === 'PPR') {
                rating = press > 16 ? 'PN 20 (SDR 6 - Hot & Cold Water)' : 'PN 16 (SDR 7.4)';
                note = 'Socket fusion PPR pipe compliant with DIN 8077.';
            } else if (mat === 'Carbon Steel') {
                rating = press > 25 ? 'Schedule 80 Extra Strong' : 'Schedule 40 Standard';
                note = 'Seamless carbon steel compliant with ASTM A106 Grade B.';
            } else if (mat === 'HDPE') {
                rating = press > 12 ? 'PE100 SDR 11 (PN 16 Bar)' : 'PE100 SDR 17 (PN 10 Bar)';
                note = 'High density polyethylene pipe for main distribution.';
            } else if (mat === 'uPVC') {
                rating = press > 10 ? 'Class 5 (15 Bar Pressure)' : 'Class 3 / Class 4';
                note = 'Solvent weld joint uPVC pipe.';
            }

            const resultBox = document.getElementById('pipe-calc-result');
            const ratingVal = document.getElementById('pipe-rating-val');
            const specNote = document.getElementById('pipe-spec-note');
            if (resultBox && ratingVal && specNote) {
                ratingVal.textContent = rating;
                specNote.textContent = note;
                resultBox.classList.remove('hidden');
            }
        });
    }

    // 7. RENDER BRANDS & INDUSTRIES
    function renderBrands() {
        if (!brandsGrid) return;

        brandsGrid.innerHTML = PRILOK_DATA.brands.map(b => `
            <div class="glass-card p-4 rounded-xl text-center border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer brand-tile hover:scale-105" data-brand="${b.name}">
                <div class="text-sm font-extrabold text-white group-hover:text-amber-400 tracking-tight font-mono">${b.name}</div>
                <div class="text-[10px] text-slate-400 mt-1">${b.category}</div>
            </div>
        `).join('');

        document.querySelectorAll('.brand-tile').forEach(tile => {
            tile.addEventListener('click', (e) => {
                const brandName = e.currentTarget.getAttribute('data-brand');
                searchQuery = brandName;
                if (heroSearchInput) heroSearchInput.value = brandName;
                activeCategory = 'all';
                renderCategoryTabs();
                renderMaterials();
                window.location.hash = '#catalog';
            });
        });
    }

    function renderIndustries() {
        if (!industriesList) return;

        industriesList.innerHTML = PRILOK_DATA.industries.map(ind => `
            <div class="p-3 rounded-xl bg-navy-950/80 border border-slate-800 space-y-1 hover:border-amber-500/40 transition-colors">
                <div class="font-bold text-white text-xs flex items-center">
                    <i data-lucide="check-circle" class="w-3.5 h-3.5 text-amber-400 mr-1.5 shrink-0"></i>
                    ${ind.title}
                </div>
                <p class="text-[11px] text-slate-400 pl-5">${ind.desc}</p>
            </div>
        `).join('');
    }

    // SEARCH INPUT EVENT LISTENERS
    if (heroSearchInput) {
        heroSearchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderMaterials();
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            searchQuery = heroSearchInput ? heroSearchInput.value : '';
            renderMaterials();
            window.location.hash = '#catalog';
        });
    }

    document.querySelectorAll('.tag-pill').forEach(pill => {
        pill.addEventListener('click', (e) => {
            const query = e.currentTarget.textContent.trim();
            searchQuery = query;
            if (heroSearchInput) heroSearchInput.value = query;
            renderMaterials();
            window.location.hash = '#catalog';
        });
    });

    // 6. CHATBOT LOGIC FOR VERSION 1
    const chatbotToggleBtn = document.getElementById('chatbot-toggle-btn');
    const chatWindow = document.getElementById('chat-window');
    const closeChatBtn = document.getElementById('close-chat-btn');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat-btn');

    if (chatbotToggleBtn) {
        chatbotToggleBtn.addEventListener('click', () => {
            chatWindow.classList.toggle('hidden');
        });
    }
    if (closeChatBtn) {
        closeChatBtn.addEventListener('click', () => chatWindow.classList.add('hidden'));
    }

    function addChatMessage(sender, text) {
        if (!chatMessages) return;
        const isUser = sender === 'user';
        const msgHtml = `
            <div class="flex items-start space-x-2 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}">
                <div class="w-7 h-7 rounded-full ${isUser ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-navy-800 text-amber-400 font-bold'} flex items-center justify-center shrink-0 text-[10px]">
                    ${isUser ? 'YOU' : 'P'}
                </div>
                <div class="p-3 rounded-2xl ${isUser ? 'bg-amber-500 text-slate-950 font-semibold rounded-tr-none' : 'bg-navy-800 text-slate-200 rounded-tl-none border border-slate-700 shadow-2xs'} max-w-[85%]">
                    ${text}
                </div>
            </div>
        `;
        chatMessages.insertAdjacentHTML('beforeend', msgHtml);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function processBotReply(userQuery) {
        const q = userQuery.toLowerCase();
        let reply = "Thank you for contacting PRILOK! Our engineering desk specializes in Civil, MEP, Cables, and Valve solutions. How can we assist your project?";

        if (q.includes('valve') || q.includes('pressure') || q.includes('crane') || q.includes('kitz')) {
            reply = "PRILOK is an authorized stockist for <strong>Crane, KITZ, AVK & Danfoss</strong> valves (Gate, Ball, Butterfly, PRV up to PN25 / Class 300). Check out our Pipe & Valve Sizing Calculator in Version 1!";
        } else if (q.includes('cable') || q.includes('tray') || q.includes('ducab')) {
            reply = "We supply certified <strong>Ducab Armored Power Cables</strong> & HDG Cable Ladders. Use our interactive Cable Tray Sizer calculator above!";
        } else if (q.includes('delivery') || q.includes('uae')) {
            reply = "We provide <strong>24-Hour Express Jobsite Dispatch</strong> across Dubai, Abu Dhabi, Sharjah, Ajman, RAK, Fujairah, and UAQ!";
        } else if (q.includes('rfq') || q.includes('pdf') || q.includes('quote')) {
            reply = "You can add items to your RFQ Cart and click <strong>'Export PDF Quote'</strong> to download an official proforma estimate instantly!";
        }

        setTimeout(() => {
            addChatMessage('bot', reply);
        }, 500);
    }

    if (sendChatBtn && chatInput) {
        const handleSend = () => {
            const text = chatInput.value.trim();
            if (text) {
                addChatMessage('user', text);
                chatInput.value = '';
                processBotReply(text);
            }
        };
        sendChatBtn.addEventListener('click', handleSend);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleSend();
        });
    }

    document.querySelectorAll('.chat-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            const intent = e.currentTarget.getAttribute('data-intent');
            const label = e.currentTarget.textContent.trim();
            addChatMessage('user', `Tell me about ${label}`);
            processBotReply(intent);
        });
    });

    // INITIALIZATION
    renderCategoryTabs();
    renderMaterials();
    renderBrands();
    renderIndustries();
});
