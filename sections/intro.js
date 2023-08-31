
function updateYearsAgo(elementId, date) {
  document.getElementById(elementId).textContent = new Date().getFullYear() - date.getFullYear()
}
updateYearsAgo('myAge', new Date('1986-10-21') )
updateYearsAgo('jlcItvAge', new Date('2006-06-12') )

const popup = document.getElementById('gallery-popup');
const popupImage = document.getElementById('popupImage');
popup.addEventListener('click', () => {
  popup.style.display = 'none'
})
const galleryImages = document.querySelectorAll('.gallery img')
for (const img of galleryImages) {
  img.addEventListener('click', () => {
    popupImage.src = img.src
    popup.style.display = 'flex'
  })
}
