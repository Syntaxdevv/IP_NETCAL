# 🌐 Network Calculator

A modern and user-friendly web-based **Network Calculator** designed to help students and networking beginners perform common IP addressing, subnetting, and network calculations.

# 🚀 How to Run
-  Clone the Repository
git clone https://github.com/Syntaxdevv/IP_NETCAL.git
- Open the Project
cd IP_NETCAL
- Run the Website

#### Open index.html directly in your browser.
#### For local development, you can also use VS Code Live Server.

## ✨ Features

### 📡 Subnetting
- Subnetting by Hosts
- Subnetting by Network Requirement

### 🔢 IPv4
- IPv4 Calculator
- Network Address
- Broadcast Address
- First Usable Host
- Last Usable Host

### 🌐 Network Tools
- IP to Binary Convert
- CIDR Calculator
-  IPv6 CIDR Calculation
  
### 🧮 Advanced
- VLSM Calculator

### 📚 References
- IPv4 Table
- IPv4 CIDR Reference

## 🛠️ Tech Stack

| Technology | Usage |
|---|---|
| HTML5 | Structure and layout |
| CSS3 | Styling and responsive design |
| JavaScript | Calculations and interactivity |
| DM Sans | Website typography |
| Bootstrap Icons | Interface icons |

## 🧮 Calculation Samples

### 📡 IPv4 Calculator

**Input:**

```text
192.168.1.25/24
```

**Output:**

```text
IP Address       : 192.168.1.25
IP Class         : Class C
IP Type          : Private
CIDR             : /24
Subnet Mask      : 255.255.255.0
Wildcard Mask    : 0.0.0.255
Network Address  : 192.168.1.0
First Usable Host: 192.168.1.1
Last Usable Host : 192.168.1.254
Broadcast Address: 192.168.1.255
Total Addresses  : 256
Usable Hosts     : 254
Binary IP        : 11000000.10101000.00000001.00011001
Binary Mask      : 11111111.11111111.11111111.00000000
```

---

### 📡 Subnetting by Hosts

**Input:**

```text
Base Network : 192.168.10.0/24
Hosts        : 50
```

**Output:**

```text
Host Bits Required : 6
New Subnet Mask    : 255.255.255.192
New CIDR           : /26
Magic Number       : 64
Total Subnets      : 4
Usable Hosts       : 62
```

**Subnet Ranges:**

```text
Network        Usable Host Range              Broadcast
192.168.10.0   192.168.10.1 - 192.168.10.62   192.168.10.63
192.168.10.64  192.168.10.65 - 192.168.10.126 192.168.10.127
192.168.10.128 192.168.10.129 - 192.168.10.190 192.168.10.191
192.168.10.192 192.168.10.193 - 192.168.10.254 192.168.10.255
```

---

### 🌐 Subnetting by Network Requirement

**Input:**

```text
Base Network : 192.168.1.0/24
Networks     : 4
```

**Output:**

```text
Borrowed Bits      : 2
New Subnet Mask    : 255.255.255.192
New CIDR           : /26
Magic Number       : 64
Required Networks  : 4
Actual Networks    : 4
Usable Hosts/Subnet: 62
```

**Network Ranges:**

```text
Network        Usable Host Range              Broadcast
192.168.1.0    192.168.1.1 - 192.168.1.62    192.168.1.63
192.168.1.64   192.168.1.65 - 192.168.1.126  192.168.1.127
192.168.1.128  192.168.1.129 - 192.168.1.190 192.168.1.191
192.168.1.192  192.168.1.193 - 192.168.1.254 192.168.1.255
```

---

### 🔢 IP to Binary Converter

**Input:**

```text
192.168.1.25
```

**Output:**

```text
Binary      : 11000000.10101000.00000001.00011001
Decimal     : 3232235801
Hexadecimal : 0xC0A80119
```

---


### 📐 CIDR Calculator

**Input:**

```text
/24
```

**Output:**

```text
Subnet Mask    : 255.255.255.0
Total Addresses: 256
Usable Hosts   : 254
Network Bits   : 24
Host Bits      : 8
```

---

### 🌐 IPv6 CIDR Calculator

**Input:**

```text
2001:db8::1/64
```

**Output:**

```text
IPv6 Address       : 2001:db8::1
CIDR Prefix        : /64
Address Type       : Global Unicast
Network Address    : 2001:db8::
Full Network       : 2001:0db8:0000:0000:0000:0000:0000:0000
Network Bits       : 64
Host Bits          : 64
Total Addresses    : 2^64
```

---

### 🧮 VLSM Calculator

**Input:**

```text
Base Network : 192.168.10.0/24

Subnet A : 100 Hosts
Subnet B : 50 Hosts
Subnet C : 20 Hosts
Subnet D : 10 Hosts
```

**Output:**

```text
Subnet A
Network       : 192.168.10.0/25
Subnet Mask   : 255.255.255.128
Usable Range  : 192.168.10.1 - 192.168.10.126
Broadcast     : 192.168.10.127
Available     : 126 Hosts

Subnet B
Network       : 192.168.10.128/26
Subnet Mask   : 255.255.255.192
Usable Range  : 192.168.10.129 - 192.168.10.190
Broadcast     : 192.168.10.191
Available     : 62 Hosts

Subnet C
Network       : 192.168.10.192/27
Subnet Mask   : 255.255.255.224
Usable Range  : 192.168.10.193 - 192.168.10.222
Broadcast     : 192.168.10.223
Available     : 30 Hosts

Subnet D
Network       : 192.168.10.224/28
Subnet Mask   : 255.255.255.240
Usable Range  : 192.168.10.225 - 192.168.10.238
Broadcast     : 192.168.10.239
Available     : 14 Hosts
```

**Remaining Addresses:**
```text
16
```

---

## 📄 License

This project is intended for educational and learning purposes. You are free to use, modify, and improve the project for personal and academic use.
