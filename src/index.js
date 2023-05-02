import { NewsApiService } from './api-service';
import Notiflix from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const refs = {
    searchForm: document.getElementById('search-form'),
    gallery: document.querySelector('.gallery'),
    loadMoreBtn: document.querySelector('.load-more'),
};

const newsApiService = new NewsApiService();
const searchBtn = refs.searchForm.children[1];
const searchInput = refs.searchForm.children[0];
const gallery = new SimpleLightbox('.gallery a', {
    overlayOpacity: 0.9,
    captionsData: 'alt',
    captionDelay: 250,
});

let sumOfPages = 0;
let totalCount = 0;

searchBtn.disabled = true;

const onLoadMore = async () => {
    newsApiService.incrementPage();

    const response = await newsApiService.fetchImages();
    totalCount += newsApiService.per_page;

    if (totalCount >= response.totalHits) {
        Notiflix.Notify.failure(
            "Sorry, there are no images matching your search query. Please try again!"
        );

        return;
    }

    renderImages(response.hits);

    const { height: cardHeight } = refs.gallery.firstElementChild.getBoundingClientRect();

    window.scrollBy({
        top: cardHeight * 2,
        behavior: 'smooth',
    });
    
    onListener();
};

const offListener = () => {
    window.removeEventListener('scroll', scrollListener);
};

const onListener = () => {
    window.addEventListener('scroll', scrollListener);
};

const scrollListener = () => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

    if (
        scrollTop + clientHeight >= scrollHeight - 5 && sumOfPages !== totalCount
    ) {
        onLoadMore();
        offListener();
    }
};

const renderImages = arr => {
    const markup = arr.reduce(
    (
        acc,
        { webformatURL, largeImageURL, tags, likes, views, comments, downloads }
    ) =>
        acc +
        `<div class="photo-card">
            <a href="${largeImageURL}">
                <img src="${webformatURL}" alt="${tags}" data-source="${largeImageURL}" loading="lazy" />
            </a>
            <div class="info">
                <p class="info-item">
                    <b>Likes</b>
                    ${likes}
                </p>
                <p class="info-item">
                    <b>Views</b>
                    ${views}
                </p>
                <p class="info-item">
                    <b>Comments</b>
                    ${comments}
                </p>
                <p class="info-item">
                    <b>Downloads</b>
                    ${downloads}
                </p>
            </div>
        </div>`,
    ''
    );
    
    refs.gallery.insertAdjacentHTML('beforeend', markup);
    
    gallery.refresh();
};

const checkResponse = ({ hits, totalHits }) => {
    totalCount = totalHits;
    sumOfPages += hits.length;

    if (hits.length === 0) {
        Notiflix.Notify.failure(
            "Sorry, there are no images matching your search query. Please try again!"
        );
    } else {
        refs.searchForm.classList.add('fixed');
        
        Notiflix.Notify.success(`Hooray! We found ${totalHits} images.`);
        renderImages(hits);
    }
};

const textInput = () => {
    if (searchInput.value) {
        searchBtn.disabled = false;
        searchBtn.style.cursor = 'pointer';
    } else {
        searchBtn.disabled = true;
        searchBtn.style.cursor = 'default';
    }
};

const onFormSubmit = async e => {
    e.preventDefault();
    refs.gallery.innerHTML = '';

    searchBtn.disabled = true;

    if (!e.currentTarget.elements[0].value.trim()) return;

    onListener();

    newsApiService.query = e.currentTarget.elements[0].value.trim();

    newsApiService.resetPage();

    const response = await newsApiService.fetchImages();

    checkResponse(response);

    refs.searchForm.reset();
};

refs.searchForm.addEventListener('submit', onFormSubmit);

searchInput.addEventListener('input', textInput);