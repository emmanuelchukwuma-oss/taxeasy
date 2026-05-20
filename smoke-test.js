const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  const browser = await chromium.launch();
  
  // Test at 375px (Mobile)
  const contextMobile = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const pageMobile = await contextMobile.newPage();
  await runTest(pageMobile, "Mobile (375px)");
  
  // Test at 1280px (Desktop)
  const contextDesktop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pageDesktop = await contextDesktop.newPage();
  await runTest(pageDesktop, "Desktop (1280px)");
  
  await browser.close();
  console.log("SMOKE TEST COMPLETE");
})();

async function runTest(page, viewportName) {
  console.log(`\n--- Running Smoke Test on ${viewportName} ---`);
  try {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for React hydration
    console.log("Navigated to home");
    
    // Check Welcome
    await page.waitForSelector('text=Pay your tax in under 90 seconds');
    console.log("Saw: Welcome screen (Pay your tax in under 90 seconds)");
    await page.click('button:has-text("Continue")');
    console.log("Clicked: Continue");
    
    // Check Phone
    await page.waitForSelector('text=Enter your phone number');
    console.log("Saw: Phone entry screen");
    await page.fill('input[placeholder="08012345678"]', '08012345678');
    console.log("Typed: 08012345678");
    await page.click('button:has-text("Send code")');
    console.log("Clicked: Send code");
    
    // Check OTP
    await page.waitForSelector('text=Verify your phone');
    console.log("Saw: OTP screen");
    await page.fill('input[placeholder="123456"]', '123456');
    console.log("Typed: 123456");
    await page.click('button:has-text("Verify and continue")');
    console.log("Clicked: Verify and continue");
    
    // Check Home
    await page.waitForSelector('text=Welcome back');
    console.log("Saw: Home dashboard (Welcome back)");
    await page.click('button:has-text("Calculate my tax")');
    console.log("Clicked: Calculate my tax");
    
    // Check Income Type
    await page.waitForSelector('text=How do you earn money?');
    console.log("Saw: Income type selection");
    await page.click('button:has-text("Freelancer / gig worker")');
    console.log("Clicked: Freelancer / gig worker");
    await page.click('button:has-text("Continue")');
    console.log("Clicked: Continue");
    
    // Check Income Input
    await page.waitForSelector('text=Enter yearly income');
    console.log("Saw: Income input form");
    await page.fill('input[placeholder="1200000"]', '1200000');
    console.log("Typed: 1200000 (Main income)");
    await page.click('button:has-text("I have side income")');
    console.log("Clicked: I have side income");
    await page.fill('input[placeholder="300000"]', '300000');
    console.log("Typed: 300000 (Side income)");
    await page.click('button:has-text("Calculate what I owe")');
    console.log("Clicked: Calculate what I owe");
    
    // Check Result
    await page.waitForSelector('text=Estimated tax');
    const taxAmount = await page.textContent('h2.text-3xl');
    console.log(`Saw: Result screen with tax amount ${taxAmount}`);
    await page.click('button:has-text("Proceed to payment")');
    console.log("Clicked: Proceed to payment");
    
    // Check Identity
    await page.waitForSelector('text=Verify identity to continue');
    console.log("Saw: Identity verification screen");
    await page.fill('input[placeholder="Enter 11-digit BVN"]', '12345678901');
    console.log("Typed: 12345678901 (BVN)");
    await page.click('button:has-text("Verify and continue")');
    console.log("Clicked: Verify and continue");
    
    // Check Payment Method
    await page.waitForSelector('text=Choose payment method');
    console.log("Saw: Payment method selector");
    await page.click('button:has-text("Card")');
    console.log("Clicked: Card");
    await page.click('button:has-text("Pay")');
    console.log("Clicked: Pay");
    
    // Check Processing
    await page.waitForSelector('text=Processing payment');
    console.log("Saw: Processing screen (wait 2s...)");
    
    // Check Success
    await page.waitForSelector('text=Payment successful', { timeout: 3000 });
    console.log("Saw: Payment successful screen");
    await page.click('button:has-text("View receipt")');
    console.log("Clicked: View receipt");
    
    // Check Receipt
    await page.waitForSelector('text=Tax payment receipt');
    console.log("Saw: Receipt placeholder screen");
    
    console.log(`✅ Success for ${viewportName}`);
  } catch (err) {
    console.error(`❌ Failed on ${viewportName}: ${err.message}`);
    const text = await page.evaluate(() => document.body.innerText);
    console.error(`Page text at failure:\n${text}`);
  }
}
