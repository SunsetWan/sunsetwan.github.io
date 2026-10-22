export async function copyCode(code, button, labels, clipboard) {
  try {
    if (typeof clipboard?.writeText !== 'function') throw new Error('Clipboard unavailable');
    await clipboard.writeText(code.textContent);
    button.textContent = labels.copied;
    button.setAttribute('aria-label', labels.copied);
    return true;
  } catch {
    button.textContent = labels.failed;
    button.setAttribute('aria-label', labels.failureDescription);
    return false;
  }
}

export function initializeCodeCopy(labels) {
  const blocks = [...document.querySelectorAll('div.highlighter-rouge')];
  document.querySelectorAll('pre').forEach(pre => {
    if (!pre.closest('div.highlighter-rouge')) blocks.push(pre);
  });

  blocks.forEach(block => {
    const code = block.querySelector('code');
    if (!code) return;
    block.style.position = 'relative';
    block.classList.add('has-code-copy');

    const language = [...block.classList, ...code.classList].find(name =>
      name.startsWith('language-') && name !== 'language-plaintext'
    );
    if (language) {
      const label = document.createElement('span');
      label.className = 'code-lang';
      label.textContent = language.replace('language-', '');
      block.appendChild(label);
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-copy';
    button.setAttribute('aria-label', labels.copyDescription);
    button.setAttribute('aria-live', 'polite');
    button.textContent = labels.copy;
    let resetTimer;
    button.addEventListener('click', async () => {
      if (button.disabled) return;
      button.disabled = true;
      clearTimeout(resetTimer);
      const copied = await copyCode(code, button, labels, globalThis.navigator?.clipboard);
      button.disabled = false;
      if (copied) {
        resetTimer = setTimeout(() => {
          button.textContent = labels.copy;
          button.setAttribute('aria-label', labels.copyDescription);
        }, 2000);
      }
    });
    const controls = document.createElement('span');
    controls.className = 'code-copy-controls';
    controls.appendChild(button);
    block.appendChild(controls);
  });
}
