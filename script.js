document.addEventListener('DOMContentLoaded', function () {
    const videoForm = document.getElementById('videoForm');
    const emailInput = document.getElementById('requestorEmail');
    const submitButton = document.getElementById('submitButton');
    const formErrorMessage = document.getElementById('formErrorMessage'); // Renamed

    // Textarea Enlarge Modal Elements
    const textareaModal = document.getElementById('textareaModal'); // Renamed
    const modalTextarea = document.getElementById('modalTextarea');
    const modalDoneButton = document.getElementById('modalDoneButton');
    const enlargeIcons = document.querySelectorAll('.enlarge-icon');
    let currentEditingTextarea = null;

    // Success Modal Elements
    const successModal = document.getElementById('successModal');
    const closeSuccessModalButton = successModal.querySelector('.close-button');
    const createAnotherButton = document.getElementById('createAnotherButton'); // Now inside successModal


    // Textarea behavior: Enlarge icon and modal
    enlargeIcons.forEach(icon => {
        icon.addEventListener('click', function () {
            currentEditingTextarea = this.previousElementSibling; // The textarea is the direct sibling before the icon
            modalTextarea.value = currentEditingTextarea.value;
            textareaModal.style.display = 'flex'; // Use flex to center content as per CSS
            modalTextarea.focus();
        });
    });

    modalDoneButton.addEventListener('click', function () {
        if (currentEditingTextarea) {
            currentEditingTextarea.value = modalTextarea.value;
        }
        textareaModal.style.display = 'none';
        currentEditingTextarea = null;
    });

    // Close modals if user clicks outside their content or presses Escape
    window.addEventListener('click', function (event) {
        if (event.target === textareaModal) { // Click outside textarea modal content
            textareaModal.style.display = 'none';
            currentEditingTextarea = null;
        }
        if (event.target === successModal) { // Click outside success modal content
            closeSuccessModal();
        }
    });

    window.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            if (textareaModal.style.display === 'flex') {
                textareaModal.style.display = 'none';
                currentEditingTextarea = null;
            }
            if (successModal.style.display === 'flex') {
                closeSuccessModal();
            }
        }
    });

    // Form validation and submission
    videoForm.addEventListener('submit', function (event) {
        event.preventDefault();
        if (validateForm()) {
            submitForm();
        }
    });

    function validateForm() {
        let isValid = true;
        clearAllErrors();

        // Validate Requestor's Email
        if (!emailInput.value.trim()) {
            showError('emailError', 'Requestor\'s Email is required.');
            isValid = false;
        } else if (!emailInput.value.endsWith('@kiwi.com')) {
            showError('emailError', 'Email must end with @kiwi.com.');
            isValid = false;
        }

        // Validate Scene Description fields
        const requiredTextareas = [
            { id: 'settingLocation', errorId: 'settingLocationError', name: 'Setting / Location' },
            { id: 'style', errorId: 'styleError', name: 'Style' },
            { id: 'timeOfDay', errorId: 'timeOfDayError', name: 'Time of Day / Lighting' },
            { id: 'charactersSubjects', errorId: 'charactersSubjectsError', name: 'Characters / Subjects' },
            { id: 'actionMovement', errorId: 'actionMovementError', name: 'Action / Movement' },
            { id: 'additionalElements', errorId: 'additionalElementsError', name: 'Additional Elements' }
        ];

        requiredTextareas.forEach(field => {
            const textarea = document.getElementById(field.id);
            if (!textarea.value.trim()) {
                showError(field.errorId, `${field.name} is required.`);
                isValid = false;
            }
        });

        return isValid;
    }

    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
        }
        // Highlight the field itself (optional)
        const field = document.getElementById(elementId.replace('Error', ''));
        if (field) {
            field.classList.add('error-field'); // Add a class for styling if needed
        }
    }

    function clearAllErrors() {
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(msg => msg.textContent = '');

        const errorFields = document.querySelectorAll('.error-field');
        errorFields.forEach(field => field.classList.remove('error-field'));
    }

    // Success Modal Functions
    function openSuccessModal() {
        successModal.style.display = 'flex';
        const confettiZIndex = 1050; // Ensure this is higher than the modal's z-index

        // Basic confetti shot
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            zIndex: confettiZIndex
        });

        // Party poppers effect
        const end = Date.now() + (3 * 1000); // 3 seconds
        const colors = ['#00a58e', '#ffbb00', '#ff4136'];

        function frame() {
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: colors,
                zIndex: confettiZIndex
            });
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: colors,
                zIndex: confettiZIndex
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }
        frame(); // Start the popper animation
    }

    function closeSuccessModal() {
        successModal.style.display = 'none';
        // Potentially stop confetti here if it's continuous, but current one is one-shot + timed
    }

    // Event listener for the success modal's close button
    closeSuccessModalButton.addEventListener('click', closeSuccessModal);


    async function submitForm() {
        formErrorMessage.textContent = ''; // Clear previous errors
        formErrorMessage.className = 'form-message'; // Reset classes, will add 'error' class if needed

        const formData = new FormData(videoForm);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        try {
            const response = await fetch('https://kiwicom.app.n8n.cloud/webhook/ab49d9f2-de99-478c-a47f-e5ef7eae655d', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                // videoForm.reset(); // Resetting form is now part of "Create Another Video" button
                // clearAllErrors(); // Also part of "Create Another Video"
                submitButton.style.display = 'none'; // Hide submit, show "Create Another" in modal
                openSuccessModal();
                // Note: The old createAnotherButton.style.display = 'block' is removed
                // as the button is now permanently in the modal, which is shown.
            } else {
                // Try to get error message from n8n if available
                const errorData = await response.json().catch(() => null);
                const errorMessageText = errorData?.message || `HTTP error! Status: ${response.status}`;
                formErrorMessage.textContent = `Form submission failed: ${errorMessageText}`;
                formErrorMessage.classList.add('error');
            }
        } catch (error) {
            formErrorMessage.textContent = `Form submission failed: ${error.message}. Please check your network connection.`;
            formErrorMessage.classList.add('error');
        }
    }

    createAnotherButton.addEventListener('click', function() {
        closeSuccessModal(); // Close the modal first
        videoForm.reset();
        clearAllErrors();
        formErrorMessage.textContent = ''; // Clear any previous error messages
        formErrorMessage.className = 'form-message'; // Reset error message classes
        submitButton.style.display = 'block'; // Show the main submit button again
        // The createAnotherButton itself is always visible within its modal, no need to hide/show it directly.

        // Ensure all fields are enabled and focus on the first field
        Array.from(videoForm.elements).forEach(el => {
            if(el.type !== 'submit' && el.type !== 'button') { // Don't disable buttons
                 el.disabled = false;
            }
        });
        if(emailInput) emailInput.focus();
    });
});
