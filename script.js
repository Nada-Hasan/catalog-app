const catalogsKey = "catalogs";
const previewDraftKey = "previewDraft";
let products = [];
let editingProductIndex = null;
let currentCatalogId = null;
let currentLogoData = "";

window.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("catalogsTable")) {
        renderCatalogsList();
        return;
    }

    if (document.getElementById("formTitle")) {
        initFormPage();
        return;
    }

    if (document.getElementById("catalog")) {
        loadPreview();
        return;
    }
});

function getCatalogs() {
    return JSON.parse(localStorage.getItem(catalogsKey) || "[]");
}

function setCatalogs(list) {
    localStorage.setItem(catalogsKey, JSON.stringify(list));
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString("ar-EG");
}

function goToForm() {
    window.location.href = "/form";
}

function renderCatalogsList() {
    const container = document.getElementById("catalogsTable");
    const catalogs = getCatalogs();

    if (!catalogs.length) {
        container.innerHTML = `
            <div class="empty-state">
                <p>لا يوجد كاتلوجات محفوظة حتى الآن.</p>
                <p>اضغط على "إنشاء كاتلوج جديد" للبدء.</p>
            </div>
        `;
        return;
    }

    const rows = catalogs
        .slice()
        .reverse()
        .map(catalog => {
            return `
            <tr>
                <td>${catalog.company || "بدون اسم"}</td>
                <td>${catalog.products?.length || 0}</td>
                <td>${formatDate(catalog.updatedAt || catalog.createdAt)}</td>
                <td class="actions-cell">
                    <button class="icon-button" type="button" onclick="editCatalog('${catalog.id}')">✎ تعديل</button>
                    <button class="icon-button danger" type="button" onclick="confirmDeleteCatalog('${catalog.id}')">🗑 حذف</button>
                    <button class="icon-button" type="button" onclick="previewCatalog('${catalog.id}')">👁 معاينة</button>
                </td>
            </tr>
        `;
        })
        .join("");

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>اسم الكاتلوج</th>
                    <th>عدد المنتجات</th>
                    <th>آخر تعديل</th>
                    <th>التحكم</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

function editCatalog(id) {
    window.location.href = `/form?id=${id}`;
}

function previewCatalog(id) {
    window.location.href = `/preview?id=${id}`;
}

function confirmDeleteCatalog(id) {
    if (confirm("هل أنت متأكد من حذف هذا الكاتلوج؟")) {
        deleteCatalog(id);
    }
}

function deleteCatalog(id) {
    const catalogs = getCatalogs().filter(catalog => String(catalog.id) !== String(id));
    setCatalogs(catalogs);
    renderCatalogsList();
}

function findCatalog(id) {
    return getCatalogs().find(catalog => String(catalog.id) === String(id));
}

async function initFormPage() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (id) {
        const catalog = findCatalog(id);
        if (catalog) {
            loadCatalogToForm(catalog);
            document.getElementById("formTitle").textContent = "تعديل الكاتلوج";
            attachStyleListeners();
            return;
        }
    }

    clearFormFields();
    attachStyleListeners();
}

function attachStyleListeners() {
    const styleFields = [
        "fontFamily",
        "fontSize",
        "fontColor",
        "fontWeight",
        "direction",
        "themeColor",
        "companyName",
        "companyNotes",
        "companyPhone"
    ];

    styleFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener("change", updateCatalogStyle);
            field.addEventListener("input", updateCatalogStyle);
        }
    });
}

function updateCatalogStyle() {
    const font = document.getElementById("fontFamily").value || "Arial";
    let fontSize = Number(document.getElementById("fontSize").value) || 20;
    fontSize = Math.max(fontSize, 20);
    const fontColor = document.getElementById("fontColor").value || "#000000";
    const fontWeight = document.getElementById("fontWeight").value || "normal";
    const direction = document.getElementById("direction").value || "rtl";
    const theme = document.getElementById("themeColor").value || "#2ecc71";
    const companyName = document.getElementById("companyName").value || "";
    const companyNotes = document.getElementById("companyNotes").value || "";
    const companyPhone = document.getElementById("companyPhone").value || "";

    // تحديث نص الشركة والملاحظات والهاتف
    document.body.dir = direction;
    
    const companyPreview = document.getElementById("companyPreview");
    const companynotesPreview = document.getElementById("companynotesPreview");
    const phonePreview = document.getElementById("phonePreview");

    if (companyPreview) companyPreview.textContent = companyName;
    if (companynotesPreview) companynotesPreview.textContent = companyNotes;
    if (phonePreview) phonePreview.textContent = companyPhone;

    if (editingProductIndex !== null && products[editingProductIndex]) {
        const product = products[editingProductIndex];
        product.fontFamily = font;
        product.fontSize = fontSize;
        product.fontColor = fontColor;
        product.fontWeight = fontWeight;
        product.direction = direction;
        renderProductsList();
        return;
    }

    // تحديث جميع الكروت بالأسلوب الجديد
    const catalogs = document.querySelectorAll(".catalog-page");
    catalogs.forEach(catalog => {
        catalog.style.fontFamily = font;
        catalog.style.fontSize = fontSize + "px";
        catalog.style.color = fontColor;
        catalog.style.fontWeight = fontWeight;
        catalog.style.direction = direction;
    });

    const cards = document.querySelectorAll(".card");
    cards.forEach(card => {
        card.style.borderColor = theme;
        const h4 = card.querySelector("h4");
        const ps = card.querySelectorAll("p");
        
        if (h4) {
            h4.style.fontFamily = font;
            h4.style.fontSize = fontSize + "px";
            h4.style.color = fontColor;
            h4.style.fontWeight = fontWeight;
        }
        
        ps.forEach(p => {
            p.style.fontFamily = font;
            p.style.color = fontColor;
            p.style.fontWeight = fontWeight;
        });
    });
}

function loadCatalogToForm(catalog) {
    currentCatalogId = catalog.id;
    currentLogoData = catalog.logo || "";
    products = Array.isArray(catalog.products) ? catalog.products.map(p => ({ ...p })) : [];

    document.getElementById("catalogId").value = catalog.id;
    document.getElementById("companyName").value = catalog.company || "";
    document.getElementById("companyNotes").value = catalog.notes || "";
    document.getElementById("companyPhone").value = catalog.phone || "";
    document.getElementById("themeColor").value = catalog.theme || "#2ecc71";
    document.getElementById("fontFamily").value = catalog.fontFamily || "Arial";
    document.getElementById("fontSize").value = catalog.fontSize || "20";
    document.getElementById("fontColor").value = catalog.fontColor || "#000000";
    document.getElementById("fontWeight").value = catalog.fontWeight || "normal";
    document.getElementById("direction").value = catalog.direction || "rtl";

    editingProductIndex = null;
    document.getElementById("addProductButton").textContent = "إضافة المنتج";
    renderProductsList();
}

async function saveCatalog(event) {
    event.preventDefault();

    const catalog = await collectFormData();

    if (!catalog.company) {
        alert("من فضلك اكتب اسم الشركة.");
        return;
    }

    if (!catalog.products.length) {
        alert("من فضلك أضف منتجًا واحدًا على الأقل.");
        return;
    }

    const catalogs = getCatalogs();
    const existingIndex = catalogs.findIndex(item => String(item.id) === String(catalog.id));

    catalog.updatedAt = Date.now();
    if (existingIndex >= 0) {
        catalogs[existingIndex] = catalog;
    } else {
        catalog.createdAt = Date.now();
        catalogs.push(catalog);
    }

    setCatalogs(catalogs);
    sessionStorage.removeItem(previewDraftKey);
    window.location.href = "/";
}

async function goPreview(event) {
    if (event) event.preventDefault();
    const catalog = await collectFormData();
    sessionStorage.setItem(previewDraftKey, JSON.stringify(catalog));
    window.location.href = "/preview";
}

async function collectFormData() {
    const companyNameInput = document.getElementById("companyName");
    const companyNotesInput = document.getElementById("companyNotes");
    const companyPhoneInput = document.getElementById("companyPhone");
    const companyLogoInput = document.getElementById("companyLogo");

    const themeColorInput = document.getElementById("themeColor");
    const fontFamilyInput = document.getElementById("fontFamily");
    const fontSizeInput = document.getElementById("fontSize");
    const fontColorInput = document.getElementById("fontColor");
    const fontWeightInput = document.getElementById("fontWeight");
    const directionInput = document.getElementById("direction");

    let logoData = currentLogoData || "";
    if (companyLogoInput.files && companyLogoInput.files[0]) {
        logoData = await readFileAsDataURL(companyLogoInput.files[0]);
        currentLogoData = logoData;
    }

    return {
        id: currentCatalogId || document.getElementById("catalogId").value || Date.now().toString(),
        company: companyNameInput.value.trim(),
        notes: companyNotesInput.value.trim(),
        phone: companyPhoneInput.value.trim(),
        logo: logoData,
        theme: themeColorInput.value,
        fontFamily: fontFamilyInput.value,
        fontSize: fontSizeInput.value,
        fontColor: fontColorInput.value,
        fontWeight: fontWeightInput.value,
        direction: directionInput.value,
        products: products.map(product => ({ ...product })),
        updatedAt: Date.now()
    };
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function renderProductsList() {
    const list = document.getElementById("productsList");
    if (!list) return;

    if (!products.length) {
        list.innerHTML = `<p class="empty-state">لا توجد منتجات مضافة بعد.</p>`;
        return;
    }

    list.innerHTML = products
        .map((product, index) => {
            const style = [];
            if (product.fontFamily) style.push(`font-family:${product.fontFamily}`);
            if (product.fontSize) style.push(`font-size:${product.fontSize}px`);
            if (product.fontColor) style.push(`color:${product.fontColor}`);
            if (product.fontWeight) style.push(`font-weight:${product.fontWeight}`);
            if (product.direction) style.push(`direction:${product.direction}`);

            return `
            <div class="product-row" style="${style.join(";")}">
                <div class="product-info">
                    <label>
                        <input type="checkbox" class="select-product" data-index="${index}">
                        ${product.name}
                    </label>
                    <span>مستهلك: ${product.publicP} ج</span>
                    <span>صيدلي: ${product.pharmacy} ج</span>
                    <span>خصم: ${product.discount}%</span>
                </div>
                <div class="product-actions">
                    <button type="button" onclick="editProduct(${index})">✎ تعديل</button>
                    <button type="button" onclick="removeOne(${index})">✖ حذف</button>
                </div>
            </div>
        `;
        })
        .join("");
}

async function addProduct(event) {
    if (event) event.preventDefault();

    const name = document.getElementById("productName").value.trim();
    const publicP = Number(document.getElementById("publicPrice").value);
    const pharmacy = Number(document.getElementById("pharmacyPrice").value);
    const imgFile = document.getElementById("productImage").files[0];

    if (!name || !publicP || !pharmacy) {
        alert("من فضلك اكمل كل بيانات المنتج");
        return;
    }

    if (publicP <= pharmacy) {
        alert("سعر الجمهور يجب ان يكون أكبر من الصيدلي");
        return;
    }

    const discount = Math.round(((publicP - pharmacy) / publicP) * 100);

    if (editingProductIndex === null) {
        if (!imgFile) {
            alert("من فضلك اختر صورة المنتج");
            return;
        }

        const image = await readFileAsDataURL(imgFile);
        products.push({
            id: Date.now().toString(),
            name,
            publicP,
            pharmacy,
            discount,
            image
        });
    } else {
        const product = products[editingProductIndex];
        product.name = name;
        product.publicP = publicP;
        product.pharmacy = pharmacy;
        product.discount = discount;

        if (imgFile) {
            product.image = await readFileAsDataURL(imgFile);
        }

        editingProductIndex = null;
        document.getElementById("addProductButton").textContent = "إضافة المنتج";
    }

    document.getElementById("productName").value = "";
    document.getElementById("publicPrice").value = "";
    document.getElementById("pharmacyPrice").value = "";
    document.getElementById("productImage").value = "";

    renderProductsList();
}

function editProduct(index) {
    const product = products[index];
    document.getElementById("productName").value = product.name;
    document.getElementById("publicPrice").value = product.publicP;
    document.getElementById("pharmacyPrice").value = product.pharmacy;
    document.getElementById("productImage").value = "";
    editingProductIndex = index;
    document.getElementById("addProductButton").textContent = "تحديث المنتج";
}

function removeOne(index) {
    products.splice(index, 1);
    renderProductsList();
}

function removeSelected() {
    const checked = Array.from(document.querySelectorAll(".select-product:checked")).map(input => Number(input.dataset.index));
    products = products.filter((_, index) => !checked.includes(index));
    renderProductsList();
}

function clearForm(event) {
    if (event) event.preventDefault();
    currentCatalogId = null;
    currentLogoData = "";
    editingProductIndex = null;
    document.getElementById("catalogId").value = "";
    document.getElementById("formTitle").textContent = "إنشاء كاتلوج جديد";
    clearFormFields();
    renderProductsList();
}

function clearFormFields() {
    document.getElementById("companyName").value = "";
    document.getElementById("companyNotes").value = "";
    document.getElementById("companyPhone").value = "";
    document.getElementById("companyLogo").value = "";
    document.getElementById("themeColor").value = "#2ecc71";
    document.getElementById("fontFamily").value = "Arial";
    document.getElementById("fontSize").value = "20";
    document.getElementById("fontColor").value = "#000000";
    document.getElementById("fontWeight").value = "normal";
    document.getElementById("direction").value = "rtl";
    products = [];
    document.getElementById("addProductButton").textContent = "إضافة المنتج";
}

function loadPreview() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    let catalog = null;

    if (id) {
        catalog = findCatalog(id);
    }

    if (!catalog) {
        const draft = sessionStorage.getItem(previewDraftKey);
        if (draft) {
            catalog = JSON.parse(draft);
        }
    }

    if (!catalog) {
        document.getElementById("catalog").innerHTML = "<p class=\"empty-state\">لا توجد بيانات للعرض.</p>";
        return;
    }

    const theme = catalog.theme || "#2ecc71";
    const font = catalog.fontFamily || "Arial";
    let fontSize = Number(catalog.fontSize) || 20;
    fontSize = Math.max(fontSize, 20);
    const fontColor = catalog.fontColor || "#000";
    const fontWeight = catalog.fontWeight || "normal";
    const direction = catalog.direction || "rtl";

    document.body.dir = direction;
    document.getElementById("companyPreview").textContent = catalog.company || "";
    document.getElementById("companynotesPreview").textContent = catalog.notes || "";
    document.getElementById("phonePreview").textContent = catalog.phone || "";

    const logoPreview = document.getElementById("logoPreview");
    if (catalog.logo) {
        logoPreview.src = catalog.logo;
        logoPreview.style.display = "block";
    } else {
        logoPreview.style.display = "none";
    }

    const catalogContainer = document.getElementById("catalog");
    catalogContainer.innerHTML = "";

    const PRODUCTS_PER_PAGE = 6;
    const productItems = Array.isArray(catalog.products) ? catalog.products : [];

    for (let i = 0; i < productItems.length; i += PRODUCTS_PER_PAGE) {
        const pageProducts = productItems.slice(i, i + PRODUCTS_PER_PAGE);
        let pageHTML = `
            <div class="catalog-page" style="font-family:${font}; font-size:${fontSize}px; color:${fontColor}; font-weight:${fontWeight};">
                <div class="catalog-grid">
        `;

        pageProducts.forEach(p => {
            const productFont = p.fontFamily || font;
            let productFontSize = Number(p.fontSize) || Number(fontSize) || 20;
            productFontSize = Math.max(productFontSize, 20);
            const productFontColor = p.fontColor || fontColor;
            const productFontWeight = p.fontWeight || fontWeight;
            const productDirection = p.direction || direction;
            const productPriceSize = Math.max(productFontSize - 2, 16);

            pageHTML += `
                    <div class="card" style="border-color:${theme};">
                        <div class="discount-badge">خصم ${p.discount}%</div>
                        <img src="${p.image}" class="product-image">
                        <h4 style="font-family:${productFont}; font-size:${productFontSize}px; color:${productFontColor}; font-weight:${productFontWeight}; direction:${productDirection};">${p.name}</h4>
                        <p style="font-family:${productFont}; font-size:${productPriceSize}px; color:${productFontColor}; font-weight:${productFontWeight}; direction:${productDirection};">مستهلك ${p.publicP} ج</p>
                        <p style="font-family:${productFont}; font-size:${productPriceSize}px; color:${productFontColor}; font-weight:${productFontWeight}; direction:${productDirection};">صيدلي: ${p.pharmacy} ج</p>
                    </div>
                `;
        });

        pageHTML += `
                </div>
            </div>
        `;

        catalogContainer.innerHTML += pageHTML;
    }
}

function savePNG() {
    const target = document.getElementById("previewContent") || document.getElementById("catalog");
    if (!target) return;

    const oldStyles = {
        margin: target.style.margin,
        width: target.style.width,
        padding: target.style.padding,
        display: target.style.display,
        position: target.style.position
    };

    const width = target.scrollWidth;
    const height = target.scrollHeight;

    target.style.margin = "0 auto";
    target.style.display = "inline-block";
    target.style.position = "relative";
    target.style.width = `${width}px`;

    html2canvas(target, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: width,
        windowHeight: height
    }).then(canvas => {
        target.style.margin = oldStyles.margin;
        target.style.width = oldStyles.width;
        target.style.padding = oldStyles.padding;
        target.style.display = oldStyles.display;
        target.style.position = oldStyles.position;

        const link = document.createElement("a");
        link.download = "catalog.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
}
