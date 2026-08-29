const CIDR_PATTERN = /^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,3})$/;

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".tab-btn").forEach(button => {
        button.addEventListener("click", () => {
            const target = document.getElementById(button.dataset.tab);
            if (!target) return;

            document.querySelectorAll(".tab-btn").forEach(btn =>
                btn.classList.remove("active")
            );
            document.querySelectorAll(".tab-content").forEach(section =>
                section.classList.remove("active")
            );

            button.classList.add("active");
            target.classList.add("active");
        });
    });

    const ipv4Input = document.getElementById("ipv4-input");
    if (ipv4Input) {
        ipv4Input.addEventListener("keydown", e => {
            if (e.key === "Enter") calculateIPv4();
        });
    }

    const ipv6Input = document.getElementById("ipv6-input");
    if (ipv6Input) {
        ipv6Input.addEventListener("keydown", e => {
            if (e.key === "Enter") calculateIPv6();
        });
    }

    const ipv6Button = document.getElementById("ipv6-calculate-btn");
    if (ipv6Button) ipv6Button.addEventListener("click", calculateIPv6);

    const cidrField = document.getElementById("cidr-input");
    if (cidrField) {
        cidrField.addEventListener("blur", () => {
            let value = cidrField.value.trim();
            if (value && !value.startsWith("/")) cidrField.value = "/" + value;
        });
    }

    const addSubnetBtn = document.getElementById("add-subnet-btn");
    const calculateVlsmBtn = document.getElementById("calculate-vlsm-btn");

    if (addSubnetBtn) addSubnetBtn.addEventListener("click", addVLSMSubnet);
    if (calculateVlsmBtn) calculateVlsmBtn.addEventListener("click", calculateVLSM);

    setupRemoveButtons();
});

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function showError(element, message) {
    if (!element) return;
    element.innerHTML = `<div class="error">${message}</div>`;
}

function validateIp(ip) {
    if (typeof ip !== "string") return false;

    const parts = ip.trim().split(".");
    if (parts.length !== 4) return false;

    return parts.every(part => {
        if (!/^\d+$/.test(part)) return false;
        const number = Number(part);
        return number >= 0 && number <= 255;
    });
}

function ipToBinary(ip) {
    return ip.split(".")
        .map(octet => Number(octet).toString(2).padStart(8, "0"))
        .join(".");
}

function ipToDecimal(ip) {
    const parts = ip.split(".").map(Number);

    return (
        parts[0] * 16777216 +
        parts[1] * 65536 +
        parts[2] * 256 +
        parts[3]
    );
}

function decimalToIp(number) {
    number = Number(number) >>> 0;

    const a = Math.floor(number / 16777216);
    number %= 16777216;

    const b = Math.floor(number / 65536);
    number %= 65536;

    const c = Math.floor(number / 256);
    const d = number % 256;

    return `${a}.${b}.${c}.${d}`;
}

function cidrToMask(cidr) {
    cidr = Number(cidr);
    if (cidr === 0) return "0.0.0.0";

    const mask = (0xFFFFFFFF << (32 - cidr)) >>> 0;
    return decimalToIp(mask);
}

function validateMask(mask) {
    if (!validateIp(mask)) return false;

    const binary = ipToBinary(mask).replace(/\./g, "");
    return !binary.includes("01");
}

function maskToCidr(mask) {
    if (!validateMask(mask)) return -1;

    const binary = ipToBinary(mask).replace(/\./g, "");
    return (binary.match(/1/g) || []).length;
}

function getBlockSize(cidr) {
    if (cidr >= 32) return 1;

    const bits = cidr % 8;
    return bits === 0 ? 256 : Math.pow(2, 8 - bits);
}

function alignToNetwork(ip, cidr) {
    const size = Math.pow(2, 32 - cidr);
    const decimal = ipToDecimal(ip);

    return decimalToIp(Math.floor(decimal / size) * size);
}

function getSubnetInfo(network, cidr) {
    const networkNumber = ipToDecimal(network);
    const totalAddresses = Math.pow(2, 32 - cidr);
    const broadcastNumber = networkNumber + totalAddresses - 1;

    let firstHost = "-";
    let lastHost = "-";
    let usableHosts = 0;

    if (cidr <= 30) {
        firstHost = decimalToIp(networkNumber + 1);
        lastHost = decimalToIp(broadcastNumber - 1);
        usableHosts = totalAddresses - 2;
    } else if (cidr === 31) {
        firstHost = decimalToIp(networkNumber);
        lastHost = decimalToIp(broadcastNumber);
        usableHosts = 2;
    } else {
        firstHost = network;
        lastHost = network;
        usableHosts = 1;
    }

    return {
        network: decimalToIp(networkNumber),
        broadcast: decimalToIp(broadcastNumber),
        firstHost,
        lastHost,
        totalAddresses,
        usableHosts
    };
}

function addRangeRow(tbody, info) {
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${info.network}</td>
        <td>${info.firstHost} - ${info.lastHost}</td>
        <td>${info.broadcast}</td>
    `;

    tbody.appendChild(row);
}

function buildRanges(tableId, network, baseCidr, newCidr) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;

    tbody.innerHTML = "";

    const base = ipToDecimal(alignToNetwork(network, baseCidr));
    const size = Math.pow(2, 32 - newCidr);
    const count = Math.min(4, Math.pow(2, newCidr - baseCidr));

    for (let i = 0; i < count; i++) {
        const info = getSubnetInfo(
            decimalToIp(base + i * size),
            newCidr
        );

        addRangeRow(tbody, info);
    }
}

function showSubnetMode(mode, button) {
    document.querySelectorAll(".subnet-mode").forEach(section =>
        section.classList.remove("active-mode")
    );

    document.querySelectorAll(".subnet-mode-btn").forEach(btn =>
        btn.classList.remove("active")
    );

    const target = document.getElementById(`${mode}-mode`);
    if (target) target.classList.add("active-mode");
    if (button) button.classList.add("active");
}

function calculateSubnettingByHosts() {
    const input = document.getElementById("host-base-cidr");
    const hostsInput = document.getElementById("hosts-required");

    if (!input || !hostsInput) return;

    const value = input.value.trim();
    const hosts = parseInt(hostsInput.value, 10);
    const match = value.match(CIDR_PATTERN);

    if (!match) {
        alert("Please enter a valid base network in CIDR, e.g. 192.168.10.0/24");
        return;
    }

    const network = match[1];
    const baseCidr = Number(match[2]);

    if (
        !validateIp(network) ||
        baseCidr < 0 ||
        baseCidr > 32 ||
        !Number.isInteger(hosts) ||
        hosts < 1
    ) {
        alert("Invalid inputs.");
        return;
    }

    const hostBits = Math.ceil(Math.log2(hosts + 2));
    const newCidr = 32 - hostBits;

    if (newCidr < baseCidr) {
        alert("The requested number of hosts does not fit inside the base network.");
        return;
    }

    const usableHosts = Math.pow(2, hostBits) - 2;
    const totalSubnets = Math.pow(2, newCidr - baseCidr);

    setText("host-bits-req", hostBits);
    setText("new-mask-req", cidrToMask(newCidr));
    setText("new-cidr-req", `/${newCidr}`);
    setText("magic-number-req", getBlockSize(newCidr));
    setText("total-subnets-req", totalSubnets);
    setText("usable-hosts-req", usableHosts);

    buildRanges(
        "host-range-table",
        network,
        baseCidr,
        newCidr
    );
}

function calculateSubnettingByNetworks() {
    const input = document.getElementById("net-base-cidr");
    const networksInput = document.getElementById("networks-required");

    if (!input || !networksInput) return;

    const value = input.value.trim();
    const networks = parseInt(networksInput.value, 10);
    const match = value.match(CIDR_PATTERN);

    if (!match) {
        alert("Please enter a valid base network in CIDR, e.g. 10.0.0.0/8");
        return;
    }

    const network = match[1];
    const baseCidr = Number(match[2]);

    if (
        !validateIp(network) ||
        baseCidr < 0 ||
        baseCidr > 32 ||
        !Number.isInteger(networks) ||
        networks < 1
    ) {
        alert("Invalid inputs.");
        return;
    }

    const borrowedBits = Math.ceil(Math.log2(networks));
    const newCidr = baseCidr + borrowedBits;

    if (newCidr > 32) {
        alert("Requested number of networks exceeds IPv4 capacity.");
        return;
    }

    const actualNetworks = Math.pow(2, borrowedBits);

    let usableHosts;

    if (newCidr <= 30) {
        usableHosts = Math.pow(2, 32 - newCidr) - 2;
    } else if (newCidr === 31) {
        usableHosts = 2;
    } else {
        usableHosts = 1;
    }

    setText("net-bits", borrowedBits);
    setText("net-new-mask", cidrToMask(newCidr));
    setText("net-new-cidr", `/${newCidr}`);
    setText("net-magic", getBlockSize(newCidr));
    setText("net-required", networks);
    setText("net-actual", actualNetworks);
    setText("net-usable-hosts", usableHosts);

    buildRanges(
        "network-range-table",
        network,
        baseCidr,
        newCidr
    );
}

function calculateIPv4() {
    const input = document.getElementById("ipv4-input");
    const result = document.getElementById("ipv4-result");

    if (!input || !result) return;

    const value = input.value.trim();
    const match = value.match(CIDR_PATTERN);

    if (!match) {
        showError(
            result,
            `Please enter a valid IPv4 address with CIDR.<br>
             Example: <strong>192.168.1.25/24</strong>`
        );
        return;
    }

    const ip = match[1];
    const cidr = Number(match[2]);

    if (!validateIp(ip) || cidr < 0 || cidr > 32) {
        showError(result, "Invalid IPv4 address or CIDR.");
        return;
    }

    const ipDecimal = ipToDecimal(ip);
    const maskDecimal = cidr === 0
        ? 0
        : (0xFFFFFFFF << (32 - cidr)) >>> 0;

    const subnetMask = decimalToIp(maskDecimal);
    const wildcardDecimal = (~maskDecimal) >>> 0;
    const wildcardMask = decimalToIp(wildcardDecimal);

    const networkDecimal = (ipDecimal & maskDecimal) >>> 0;
    const networkAddress = decimalToIp(networkDecimal);

    const broadcastDecimal =
        (networkDecimal | wildcardDecimal) >>> 0;

    const broadcastAddress = decimalToIp(broadcastDecimal);
    const totalAddresses = Math.pow(2, 32 - cidr);

    let usableHosts;

    if (cidr === 32) {
        usableHosts = 1;
    } else if (cidr === 31) {
        usableHosts = 2;
    } else {
        usableHosts = totalAddresses - 2;
    }

    let firstHost;
    let lastHost;

    if (cidr === 32) {
        firstHost = networkAddress;
        lastHost = networkAddress;
    } else if (cidr === 31) {
        firstHost = networkAddress;
        lastHost = broadcastAddress;
    } else {
        firstHost = decimalToIp(networkDecimal + 1);
        lastHost = decimalToIp(broadcastDecimal - 1);
    }

    const firstOctet = Number(ip.split(".")[0]);
    let ipClass;

    if (firstOctet >= 1 && firstOctet <= 126) {
        ipClass = "Class A";
    } else if (firstOctet >= 128 && firstOctet <= 191) {
        ipClass = "Class B";
    } else if (firstOctet >= 192 && firstOctet <= 223) {
        ipClass = "Class C";
    } else if (firstOctet >= 224 && firstOctet <= 239) {
        ipClass = "Class D (Multicast)";
    } else if (firstOctet >= 240 && firstOctet <= 255) {
        ipClass = "Class E (Experimental)";
    } else {
        ipClass = "Special / Reserved";
    }

    const secondOctet = Number(ip.split(".")[1]);
    let ipType = "Public";

    if (
        firstOctet === 10 ||
        (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) ||
        (firstOctet === 192 && secondOctet === 168)
    ) {
        ipType = "Private";
    } else if (firstOctet === 127) {
        ipType = "Loopback";
    } else if (firstOctet === 169 && secondOctet === 254) {
        ipType = "Link-Local";
    } else if (firstOctet === 0) {
        ipType = "Special / Reserved";
    }

    const binaryIP = ipToBinary(ip);
    const binaryMask = ipToBinary(subnetMask);

    result.innerHTML = `
        <div class="ipv4-result-grid">
            ${resultItem("IP Address", ip)}
            ${resultItem("IP Class", ipClass)}
            ${resultItem("IP Type", ipType)}
            ${resultItem("CIDR", `/${cidr}`)}
            ${resultItem("Subnet Mask", subnetMask)}
            ${resultItem("Wildcard Mask", wildcardMask)}
            ${resultItem("Network Address", networkAddress)}
            ${resultItem("First Usable Host", firstHost)}
            ${resultItem("Last Usable Host", lastHost)}
            ${resultItem("Broadcast Address", broadcastAddress)}
            ${resultItem("Total Addresses", totalAddresses.toLocaleString())}
            ${resultItem("Usable Hosts", usableHosts.toLocaleString())}
            ${resultItem("Binary IP", binaryIP, true)}
            ${resultItem("Binary Subnet Mask", binaryMask, true)}
        </div>
    `;
}

function resultItem(label, value, binary = false) {
    return `
        <div class="result-item ${binary ? "binary-result" : ""}">
            <span class="label">${label}</span>
            <span class="value">${value}</span>
        </div>
    `;
}

function convertIP() {
    const input = document.getElementById("ip-input");
    const result = document.getElementById("ip-conversion-result");

    if (!input || !result) return;

    const value = input.value.trim();

    if (!validateIp(value)) {
        showError(result, "Invalid IPv4 address format.");
        return;
    }

    const decimal = ipToDecimal(value);

    result.innerHTML = `
        <strong>Binary:</strong> ${ipToBinary(value)}<br>
        <strong>Decimal:</strong> ${decimal.toLocaleString()}<br>
        <strong>Hexadecimal:</strong>
        0x${decimal.toString(16).toUpperCase().padStart(8, "0")}
    `;
}

function convertBinary() {
    const input = document.getElementById("binary-input");
    const result = document.getElementById("binary-conversion-result");

    if (!input || !result) return;

    const value = input.value.trim();

    if (!/^[01]+$/.test(value)) {
        showError(result, "Please enter valid binary digits (0 or 1).");
        return;
    }

    if (value.length > 32) {
        showError(result, "Binary value cannot exceed 32 bits.");
        return;
    }

    const decimal = parseInt(value, 2);

    result.innerHTML = `
        <strong>Decimal:</strong> ${decimal.toLocaleString()}<br>
        <strong>Hexadecimal:</strong> 0x${decimal.toString(16).toUpperCase()}<br>
        <strong>Binary Length:</strong> ${value.length} bits
    `;
}

function calculateCIDR() {
    const input = document.getElementById("cidr-input");
    const result = document.getElementById("cidr-result");

    if (!input || !result) return;

    let value = input.value.trim();
    if (!value.startsWith("/")) value = "/" + value;

    const match = value.match(/^\/(\d{1,2})$/);

    if (!match) {
        showError(
            result,
            "Please enter valid CIDR notation, e.g. /24."
        );
        return;
    }

    const cidr = Number(match[1]);

    if (cidr < 0 || cidr > 32) {
        showError(result, "CIDR must be between 0 and 32.");
        return;
    }

    const total = Math.pow(2, 32 - cidr);

    let usable;

    if (cidr === 32) {
        usable = 1;
    } else if (cidr === 31) {
        usable = 2;
    } else {
        usable = total - 2;
    }

    result.innerHTML = `
        <strong>Subnet Mask:</strong> ${cidrToMask(cidr)}<br>
        <strong>Total Addresses:</strong> ${total.toLocaleString()}<br>
        <strong>Usable Hosts:</strong> ${usable.toLocaleString()}<br>
        <strong>Network Bits:</strong> ${cidr}<br>
        <strong>Host Bits:</strong> ${32 - cidr}
    `;
}

function isValidIPv6(address) {
    if (!address || typeof address !== "string") return false;

    address = address.trim();

    if (address.includes(":::")) return false;

    const doubleColonCount = (address.match(/::/g) || []).length;

    if (doubleColonCount > 1) return false;

    const parts = address.split(":");

    for (const part of parts) {
        if (part === "") continue;
        if (!/^[0-9a-fA-F]{1,4}$/.test(part)) return false;
    }

    if (doubleColonCount === 0) return parts.length === 8;

    return parts.length <= 8;
}

function expandIPv6(address) {
    address = address.toLowerCase().trim();

    if (!isValidIPv6(address)) return null;

    if (address.includes("::")) {
        const sides = address.split("::");
        const left = sides[0] ? sides[0].split(":") : [];
        const right = sides[1] ? sides[1].split(":") : [];
        const missing = 8 - left.length - right.length;
        const zeros = new Array(missing).fill("0");

        return [
            ...left,
            ...zeros,
            ...right
        ].map(group => group.padStart(4, "0"));
    }

    return address.split(":")
        .map(group => group.padStart(4, "0"));
}

function compressIPv6(groups) {
    const normalized = groups.map(group =>
        group.replace(/^0+/, "") || "0"
    );

    let bestStart = -1;
    let bestLength = 0;
    let currentStart = -1;
    let currentLength = 0;

    for (let i = 0; i < normalized.length; i++) {
        if (normalized[i] === "0") {
            if (currentStart === -1) {
                currentStart = i;
                currentLength = 1;
            } else {
                currentLength++;
            }
        } else {
            if (currentLength > bestLength) {
                bestStart = currentStart;
                bestLength = currentLength;
            }

            currentStart = -1;
            currentLength = 0;
        }
    }

    if (currentLength > bestLength) {
        bestStart = currentStart;
        bestLength = currentLength;
    }

    if (bestLength < 2) return normalized.join(":");

    const left = normalized.slice(0, bestStart).join(":");
    const right = normalized.slice(bestStart + bestLength).join(":");

    if (!left && !right) return "::";
    if (!left) return "::" + right;
    if (!right) return left + "::";

    return left + "::" + right;
}

function ipv6ToBinary(groups) {
    return groups.map(group =>
        parseInt(group, 16)
            .toString(2)
            .padStart(16, "0")
    ).join(":");
}

function calculateIPv6() {
    const input = document.getElementById("ipv6-input");
    const result = document.getElementById("ipv6-result");

    if (!input || !result) return;

    const value = input.value.trim();

    if (!value.includes("/")) {
        showError(
            result,
            `Please enter an IPv6 address with CIDR.<br>
             Example: <strong>2001:db8::1/64</strong>`
        );
        return;
    }

    const slashIndex = value.lastIndexOf("/");
    const address = value.substring(0, slashIndex);
    const cidrText = value.substring(slashIndex + 1);
    const cidr = Number(cidrText);

    if (
        !isValidIPv6(address) ||
        !Number.isInteger(cidr) ||
        cidr < 0 ||
        cidr > 128
    ) {
        showError(
            result,
            `Invalid IPv6 address or CIDR.<br>
             Example: <strong>2001:db8::1/64</strong>`
        );
        return;
    }

    const groups = expandIPv6(address);

    if (!groups) {
        showError(result, "Invalid IPv6 address.");
        return;
    }

    const networkGroups = groups.map((group, index) => {
        const bitsBefore = index * 16;

        if (bitsBefore >= cidr) return "0000";
        if (bitsBefore + 16 <= cidr) return group;

        const remainingBits = cidr - bitsBefore;
        const value = parseInt(group, 16);
        const mask = (0xFFFF << (16 - remainingBits)) & 0xFFFF;

        return (value & mask)
            .toString(16)
            .padStart(4, "0");
    });

    const networkAddress = compressIPv6(networkGroups);
    const fullNetworkAddress = networkGroups.join(":");
    const binaryAddress = ipv6ToBinary(groups);

    let addressType = "Global Unicast";

    const firstGroup = parseInt(groups[0], 16);
    const firstByte = firstGroup >> 8;

    if (address.toLowerCase().startsWith("fe80:")) {
        addressType = "Link-Local";
    } else if ((firstByte & 0xFE) === 0xFC) {
        addressType = "Unique Local Address (ULA)";
    } else if (address.toLowerCase() === "::1") {
        addressType = "Loopback";
    } else if (address === "::") {
        addressType = "Unspecified";
    } else if (firstByte === 0xFF) {
        addressType = "Multicast";
    }

    const totalAddresses =
        cidr === 128 ? "1" : `2^${128 - cidr}`;

    const hostBits = 128 - cidr;

    result.innerHTML = `
        <div class="ipv4-result-grid">
            ${resultItem("IPv6 Address", compressIPv6(groups))}
            ${resultItem("CIDR Prefix", `/${cidr}`)}
            ${resultItem("Address Type", addressType)}
            ${resultItem("Network Address", networkAddress)}
            ${resultItem("Full Network Address", fullNetworkAddress)}
            ${resultItem("Network Bits", cidr)}
            ${resultItem("Host Bits", hostBits)}
            ${resultItem("Total Addresses", totalAddresses)}
            ${resultItem("Expanded IPv6", groups.join(":"), true)}
            ${resultItem("Binary IPv6", binaryAddress, true)}
        </div>
    `;
}

function setupRemoveButtons() {
    document.querySelectorAll(".remove-subnet").forEach(button => {
        button.onclick = removeVLSMSubnet;
    });
}

function addVLSMSubnet() {
    const list = document.getElementById("subnet-list");
    if (!list) return;

    const number = list.children.length + 1;
    const div = document.createElement("div");

    div.className = "subnet-input";

    div.innerHTML = `
        <input type="text" class="subnet-name"
            placeholder="Subnet Name"
            value="LAN ${number}">

        <input type="number" class="subnet-hosts"
            placeholder="Required Hosts"
            min="1">

        <button type="button" class="remove-subnet">
            <i class="fas fa-trash"></i>
        </button>
    `;

    list.appendChild(div);

    div.querySelector(".remove-subnet")
        .addEventListener("click", removeVLSMSubnet);
}

function removeVLSMSubnet(event) {
    const list = document.getElementById("subnet-list");
    if (!list) return;

    if (list.children.length <= 1) {
        alert("You need at least one subnet.");
        return;
    }

    event.currentTarget.parentElement.remove();
}

function calculateVLSM() {
    const networkInput = document.getElementById("vlsm-network");
    const result = document.getElementById("vlsm-results");
    const list = document.getElementById("subnet-list");

    if (!networkInput || !result || !list) return;

    const baseValue = networkInput.value.trim();
    const match = baseValue.match(CIDR_PATTERN);

    if (!match) {
        showError(
            result,
            `Please enter a valid base network.<br>
             Example: <strong>192.168.1.0/24</strong>`
        );
        return;
    }

    const baseIP = match[1];
    const baseCIDR = Number(match[2]);

    if (!validateIp(baseIP) || baseCIDR < 0 || baseCIDR > 30) {
        showError(
            result,
            "Invalid base network. VLSM requires an IPv4 network."
        );
        return;
    }

    const baseNetwork = alignToNetwork(baseIP, baseCIDR);
    const baseDecimal = ipToDecimal(baseNetwork);
    const baseSize = Math.pow(2, 32 - baseCIDR);
    const baseEnd = baseDecimal + baseSize - 1;

    const names = list.querySelectorAll(".subnet-name");
    const hosts = list.querySelectorAll(".subnet-hosts");
    const requirements = [];

    for (let i = 0; i < names.length; i++) {
        const name = names[i].value.trim() || `Subnet ${i + 1}`;
        const hostCount = parseInt(hosts[i].value, 10);

        if (!Number.isInteger(hostCount) || hostCount < 1) {
            showError(
                result,
                `Invalid host requirement for <strong>${name}</strong>.`
            );
            return;
        }

        const requiredAddresses = hostCount + 2;
        const hostBits = Math.ceil(Math.log2(requiredAddresses));
        const blockSize = Math.pow(2, hostBits);
        const cidr = 32 - hostBits;

        requirements.push({
            name,
            requestedHosts: hostCount,
            hostBits,
            blockSize,
            cidr
        });
    }

    requirements.sort((a, b) => b.blockSize - a.blockSize);

    let current = baseDecimal;
    const results = [];

    for (const subnet of requirements) {
        const networkDecimal =
            Math.ceil(current / subnet.blockSize) * subnet.blockSize;

        const broadcastDecimal =
            networkDecimal + subnet.blockSize - 1;

        if (broadcastDecimal > baseEnd) {
            showError(
                result,
                `The requested VLSM subnets do not fit inside <strong>${baseNetwork}/${baseCIDR}</strong>.`
            );
            return;
        }

        const network = decimalToIp(networkDecimal);
        const broadcast = decimalToIp(broadcastDecimal);

        let firstHost;
        let lastHost;
        let usableHosts;

        if (subnet.cidr <= 30) {
            firstHost = decimalToIp(networkDecimal + 1);
            lastHost = decimalToIp(broadcastDecimal - 1);
            usableHosts = subnet.blockSize - 2;
        } else if (subnet.cidr === 31) {
            firstHost = network;
            lastHost = broadcast;
            usableHosts = 2;
        } else {
            firstHost = network;
            lastHost = network;
            usableHosts = 1;
        }

        results.push({
            name: subnet.name,
            requestedHosts: subnet.requestedHosts,
            allocatedHosts: usableHosts,
            network,
            cidr: subnet.cidr,
            mask: cidrToMask(subnet.cidr),
            firstHost,
            lastHost,
            broadcast,
            blockSize: subnet.blockSize
        });

        current = broadcastDecimal + 1;
    }

    let tableRows = "";

    results.forEach(item => {
        tableRows += `
            <tr>
                <td>${item.name}</td>
                <td>${item.requestedHosts}</td>
                <td>${item.network}/${item.cidr}</td>
                <td>${item.mask}</td>
                <td>${item.firstHost} - ${item.lastHost}</td>
                <td>${item.broadcast}</td>
                <td>${item.allocatedHosts}</td>
            </tr>
        `;
    });

    const remaining = baseEnd - current + 1;

    result.innerHTML = `
        <div class="results">
            <div class="result-item">
                <span class="label">Base Network</span>
                <span class="value">${baseNetwork}/${baseCIDR}</span>
            </div>

            <div class="result-item">
                <span class="label">Total Addresses</span>
                <span class="value">${baseSize.toLocaleString()}</span>
            </div>

            <div class="result-item">
                <span class="label">Remaining Addresses</span>
                <span class="value">${remaining.toLocaleString()}</span>
            </div>
        </div>

        <div class="range-table-container">
            <h3>
                <i class="fas fa-table"></i>
                VLSM Allocation
            </h3>

            <table class="range-table">
                <thead>
                    <tr>
                        <th>Subnet</th>
                        <th>Required Hosts</th>
                        <th>Network</th>
                        <th>Subnet Mask</th>
                        <th>Usable Range</th>
                        <th>Broadcast</th>
                        <th>Available Hosts</th>
                    </tr>
                </thead>

                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;
}