
{ // code for the light switch
  let lightIsOn
  const lightSwitch = document.getElementById('btn_lightSwitch')
  lightSwitch.addEventListener('click', () => setLightSwitch(!lightIsOn))
  const mql = window.matchMedia('(prefers-color-scheme: light)')
  setLightSwitch(localStorage.getItem('lightIsOn') ?? mql.matches)
  mql.addEventListener('change', e => setLightSwitch(e.matches))

  function setLightSwitch(light) {
    lightIsOn = (light === true || light == 'true')
    document.documentElement.className = lightIsOn ? 'light' : 'dark'
    lightSwitch.innerText = lightIsOn ? 'Lights off 🌛' : 'Lights on 🌞'
    localStorage.setItem('lightIsOn', ''+lightIsOn)
  }
}

{ // navigation code
  const el_nav = document.getElementById('nav')
  const el_page = document.getElementById('page')
  const pages = {
    intro: {title: 'Intro', htmlPath: 'sections/intro.html', scriptPath: 'sections/intro.js'},
    projects: {title: 'My projects'},
    featured: {title: 'I\'m featured here'}
  }
  for (const page of Object.values(pages)) {
    const listItem = document.createElement('li')
    const link = document.createElement('a')
    page.el_link = link
    link.addEventListener('click', () => loadPage(page))
    link.textContent = page.title
    listItem.append(link)
    el_nav.append(listItem)
  }
  let currentPage
  loadPage(pages.intro)

  async function loadPage(page) {
    if (currentPage == page) return
    if (currentPage) currentPage.el_link.classList.remove('selected')
    currentPage = page
    page.el_link.classList.add('selected')
    let {htmlPath, scriptPath, htmlContent, scriptContent} = page
    let script
    if (scriptPath) { // has a script
      script = document.createElement('script')
      script.type = 'module'
      if (!scriptContent) { // if not cached
        scriptContent = await (await fetch(scriptPath)).text()
        page.scriptContent = scriptContent
      }
      script.innerHTML = scriptContent
    }
    if (!htmlContent) {
      htmlContent = await (await fetch(htmlPath)).text()
      page.htmlContent = htmlContent
    }
    el_page.innerHTML = htmlContent // (replaces any previous content)
    if (script) el_page.append(script) // executes it
  }
}
