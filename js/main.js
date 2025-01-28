// Main JavaScript file

$(document).ready(function() {
    // Initialize AOS
    AOS.init({
        duration: 800,
        once: true,
        offset: 50,
        easing: 'ease-out',
        disable: 'mobile',
        mirror: false,
        anchorPlacement: 'top-bottom'
    });

    // Smooth scrolling for anchor links
    $('a[href^="#"]').on('click', function(event) {
        event.preventDefault();
        
        $('html, body').animate({
            scrollTop: $($.attr(this, 'href')).offset().top - 80
        }, 800);
    });

    // Navbar background change on scroll
    $(window).scroll(function() {
        if ($(window).scrollTop() > 50) {
            $('.navbar').addClass('navbar-scrolled');
        } else {
            $('.navbar').removeClass('navbar-scrolled');
        }
    });

    // Parallax effect
    $(window).scroll(function() {
        $('.parallax-section').each(function() {
            let scroll = $(window).scrollTop();
            let speed = $(this).data('speed') || 0.5;
            $(this).css('background-position', 'center ' + (scroll * speed) + 'px');
        });
    });

    // Video modal
    $('.video-btn').click(function() {
        let videoSrc = $(this).data('src');
        $('#videoModal iframe').attr('src', videoSrc);
        $('#videoModal').modal('show');
    });

    $('#videoModal').on('hidden.bs.modal', function() {
        $('#videoModal iframe').attr('src', '');
    });

    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });

    // Counter animation
    $('.counter').each(function() {
        $(this).prop('Counter', 0).animate({
            Counter: $(this).text()
        }, {
            duration: 2000,
            easing: 'swing',
            step: function(now) {
                $(this).text(Math.ceil(now));
            }
        });
    });

    // Form validation with animation
    $('.contact-form').on('submit', function(e) {
        e.preventDefault();
        
        let form = $(this);
        let submitBtn = form.find('button[type="submit"]');
        let originalBtnText = submitBtn.text();
        
        // Basic validation
        let isValid = true;
        form.find('input[required], textarea[required]').each(function() {
            if (!$(this).val()) {
                isValid = false;
                $(this).addClass('is-invalid').parent()
                    .append('<div class="invalid-feedback">This field is required</div>');
            } else {
                $(this).removeClass('is-invalid').parent()
                    .find('.invalid-feedback').remove();
            }
        });

        if (!isValid) {
            return false;
        }

        // Simulate form submission with animation
        submitBtn.prop('disabled', true)
            .html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...');
        
        setTimeout(function() {
            submitBtn.prop('disabled', false).text(originalBtnText);
            form.trigger('reset');
            
            // Show success message with animation
            const successAlert = $('<div class="alert alert-success" role="alert" style="display: none;">' +
                                 'Message sent successfully!</div>');
            form.prepend(successAlert);
            successAlert.slideDown();
            
            setTimeout(() => successAlert.slideUp(() => successAlert.remove()), 3000);
        }, 1500);
    });

    // Add hover effect to cards
    $('.feature-card, .school-card, .team-card, .testimonial-card').hover(
        function() {
            $(this).find('img, i').addClass('hover-rotate');
        },
        function() {
            $(this).find('img, i').removeClass('hover-rotate');
        }
    );

    // Reveal elements on scroll
    $(window).scroll(function() {
        revealOnScroll();
    });

    function revealOnScroll() {
        var windowHeight = $(window).height();
        var scrollTop = $(window).scrollTop();

        $('.reveal').each(function() {
            var elementTop = $(this).offset().top;
            var elementVisible = 150;

            if (elementTop < (windowHeight + scrollTop) - elementVisible) {
                $(this).addClass('active');
            }
        });
    }
});

// Result Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the results page
    if (document.querySelector('.results-hero')) {
        initializeResultsPage();
    }
});

function initializeResultsPage() {
    // Load results data from JSON file
    fetch('data/results.json')
        .then(response => response.json())
        .then(data => {
            // Store data globally
            window.resultsData = data;
            
            // Initialize components
            populateToppers(data.toppers.class10);
            setupEventListeners();
            loadResults('class10'); // Load Class 10 results by default
        })
        .catch(error => {
            console.error('Error loading results:', error);
        });
}

function populateToppers(toppers) {
    const swiperWrapper = document.querySelector('.toppers-swiper .swiper-wrapper');
    if (!swiperWrapper) return;

    swiperWrapper.innerHTML = ''; // Clear existing slides
    toppers.forEach(topper => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = `
            <div class="topper-slide">
                <img src="${topper.image}" alt="${topper.name}" class="topper-image">
                <h4 class="mt-3">${topper.name}</h4>
                <p class="mb-1">Class ${topper.class}</p>
                <p class="mb-1">${topper.percentage}</p>
                <p class="text-primary">${topper.rank} Rank</p>
            </div>
        `;
        swiperWrapper.appendChild(slide);
    });

    // Reinitialize Swiper
    if (window.topperSwiper) {
        window.topperSwiper.update();
    }
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const classFilters = document.querySelectorAll('.class-filter');

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            searchResults(searchInput.value);
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchResults(searchInput.value);
            }
        });
    }

    classFilters.forEach(filter => {
        filter.addEventListener('click', () => {
            // Update active state
            classFilters.forEach(f => f.classList.remove('active'));
            filter.classList.add('active');

            // Load results for selected class
            const classType = filter.dataset.class;
            loadResults(classType);
            populateToppers(window.resultsData.toppers[classType]);
        });
    });

    // Setup modal event listeners
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-details')) {
            const resultData = JSON.parse(e.target.dataset.result);
            showResultDetails(resultData);
        }
    });
}

function searchResults(query) {
    if (!query) return;
    
    showLoading(true);
    
    // Get current selected class
    const activeFilter = document.querySelector('.class-filter.active');
    const classType = activeFilter ? activeFilter.dataset.class : 'class10';
    
    // Filter results
    const results = window.resultsData.results[classType].filter(result => {
        const searchStr = query.toLowerCase();
        return result.rollNo.toLowerCase().includes(searchStr) || 
               result.name.toLowerCase().includes(searchStr);
    });
    
    setTimeout(() => {
        displayResults(results);
        if (results.length === 1) {
            highlightSearchResult(results[0].rollNo);
        }
        showLoading(false);
    }, 500); // Add small delay for loading animation
}

function loadResults(classType) {
    showLoading(true);
    
    setTimeout(() => {
        const results = window.resultsData.results[classType] || [];
        displayResults(results);
        showLoading(false);
    }, 500);
}

function displayResults(results) {
    const tbody = document.querySelector('#resultsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    results.forEach(result => {
        const row = document.createElement('tr');
        row.dataset.rollNo = result.rollNo;
        row.innerHTML = `
            <td>${result.rollNo}</td>
            <td>${result.name}</td>
            <td>${result.class}</td>
            <td>${result.totalMarks}</td>
            <td>${result.percentage}</td>
            <td><span class="badge bg-${result.status === 'Pass' ? 'success' : 'danger'}">${result.status}</span></td>
            <td>
                <button class="btn btn-sm btn-primary view-details" data-result='${JSON.stringify(result)}'>
                    <i class="fas fa-eye"></i> View
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Add no results message if needed
    if (results.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">No results found</td>
            </tr>
        `;
    }
}

function showResultDetails(result) {
    const modal = new bootstrap.Modal(document.getElementById('resultDetailModal'));
    const modalBody = document.querySelector('#resultDetailModal .modal-body');
    
    modalBody.innerHTML = `
        <div class="text-center mb-4">
            <h4>${result.name}</h4>
            <p class="text-muted mb-0">Roll No: ${result.rollNo}</p>
            <p class="text-muted">Class ${result.class}</p>
        </div>
        <div class="row">
            <div class="col-6">
                <p><strong>Total Marks:</strong> ${result.totalMarks}</p>
            </div>
            <div class="col-6">
                <p><strong>Percentage:</strong> ${result.percentage}</p>
            </div>
        </div>
        <hr>
        <h5 class="mb-3">Subject Wise Marks</h5>
        <div class="d-flex flex-wrap">
            ${Object.entries(result.subjects).map(([subject, marks]) => `
                <div class="subject-score">
                    ${subject}: ${marks}
                </div>
            `).join('')}
        </div>
    `;
    
    modal.show();
}

function highlightSearchResult(rollNo) {
    const row = document.querySelector(`tr[data-roll-no="${rollNo}"]`);
    if (row) {
        row.classList.add('highlight');
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.classList.toggle('d-none', !show);
    }
}
