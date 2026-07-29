with open('Aspirant/aspirant-dashboard.html', 'r', encoding='utf-8') as f:
    c = f.read()

# The string literally has a newline in it right now.
broken_str = 'alert("✅ Payment Submitted!\nYour UTR has been sent for verification. You will get course access once the Admin approves it.");'
fixed_str = 'alert("✅ Payment Submitted!\\nYour UTR has been sent for verification. You will get course access once the Admin approves it.");'

c = c.replace(broken_str, fixed_str)

with open('Aspirant/aspirant-dashboard.html', 'w', encoding='utf-8') as f:
    f.write(c)
print("Fixed!")
