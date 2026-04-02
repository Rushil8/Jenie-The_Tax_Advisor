document.addEventListener("DOMContentLoaded", function () {
    const emiForm = document.getElementById("emiForm");
    
    if (emiForm) {
        emiForm.addEventListener("submit", function (e) {
            e.preventDefault();
            
            // Get input values
            const principal = parseFloat(document.getElementById("principal").value);
            const rate = parseFloat(document.getElementById("rate").value);
            const months = parseInt(document.getElementById("months").value);
            
            // Validate
            if (isNaN(principal) || isNaN(rate) || isNaN(months) || principal <= 0 || rate <= 0 || months <= 0) {
                alert("Please enter valid positive numbers for all fields.");
                return;
            }
            
            // Math logic
            // Monthly Interest Rate -> R = (Annual Rate / 12) / 100
            const monthlyRate = (rate / 12) / 100;
            
            // EMI Formula -> P * R * ((1+R)^N) / (((1+R)^N) - 1)
            const param = Math.pow(1 + monthlyRate, months);
            const emi = (principal * monthlyRate * param) / (param - 1);
            
            const totalPayment = emi * months;
            const totalInterest = totalPayment - principal;
            
            // Display Results (fixing to 2 decimal places)
            // Use Intl.NumberFormat for Indian Rupees or default formatting
            const formatter = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                minimumFractionDigits: 2
            });

            document.getElementById("emiValue").textContent = formatter.format(emi);
            document.getElementById("totalInterest").textContent = formatter.format(totalInterest);
            document.getElementById("totalPayment").textContent = formatter.format(totalPayment);
            
            document.getElementById("emiResult").style.display = "block";
        });
    }
});

function clearResult() {
    document.getElementById("emiResult").style.display = "none";
    document.getElementById("emiValue").textContent = "0";
    document.getElementById("totalInterest").textContent = "0";
    document.getElementById("totalPayment").textContent = "0";
}
