document.addEventListener('DOMContentLoaded', function () {
    const videoForm = document.getElementById('videoForm');
    const modal = document.getElementById('modal');
    const modalTextarea = document.getElementById('modalTextarea');
    const modalDoneButton = document.getElementById('modalDoneButton');
    const enlargeIcons = document.querySelectorAll('.enlarge-icon');
    const emailInput = document.getElementById('requestorEmail');
    const formMessage = document.getElementById('formMessage');
    const submitButton = document.getElementById('submitButton');
    const createAnotherButton = document.getElementById('createAnotherButton');

    let currentEditingTextarea = null;

    // Textarea behavior: Enlarge icon and modal
    enlargeIcons.forEach(icon => {
        icon.addEventListener('click', function () {
            currentEditingTextarea = this.previousElementSibling; // The textarea is the direct sibling before the icon
            modalTextarea.value = currentEditingTextarea.value;
            modal.style.display = 'flex'; // Use flex to center content as per CSS
            modalTextarea.focus();
        });
    });

    modalDoneButton.addEventListener('click', function () {
        if (currentEditingTextarea) {
            currentEditingTextarea.value = modalTextarea.value;
        }
        modal.style.display = 'none';
        currentEditingTextarea = null;
    });

    // Close modal if user clicks outside the modal content
    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            currentEditingTextarea = null;
        }
    });

    // Prevent textarea resizing (already handled by CSS `resize: none;`)

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

    async function submitForm() {
        formMessage.textContent = '';
        formMessage.className = 'form-message'; // Reset classes

        const formData = new FormData(videoForm);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        try {
            const response = await fetch('https://kiwicom.app.n8n.cloud/webhook-test/ab49d9f2-de99-478c-a47f-e5ef7eae655d', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                formMessage.textContent = 'Your video is being created. This will take approximately half an hour. We will inform you via Slack for further details.';
                formMessage.classList.add('success');
                videoForm.reset();
                clearAllErrors();
                submitButton.style.display = 'none';
                createAnotherButton.style.display = 'block';
            } else {
                // Try to get error message from n8n if available
                const errorData = await response.json().catch(() => null);
                const errorMessage = errorData?.message || `HTTP error! Status: ${response.status}`;
                formMessage.textContent = `Form submission failed: ${errorMessage}`;
                formMessage.classList.add('error');
            }
        } catch (error) {
            formMessage.textContent = `Form submission failed: ${error.message}. Please check your network connection.`;
            formMessage.classList.add('error');
        }
    }

    createAnotherButton.addEventListener('click', function() {
        videoForm.reset();
        clearAllErrors();
        formMessage.textContent = '';
        formMessage.className = 'form-message';
        submitButton.style.display = 'block';
        createAnotherButton.style.display = 'none';
        // Ensure all fields are enabled and focus on the first field
        Array.from(videoForm.elements).forEach(el => el.disabled = false);
        if(emailInput) emailInput.focus();
    });

});
