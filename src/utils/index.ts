function onCopyClick(e: MouseEvent) {
  const target = e.target as any;

  let timeout1: ReturnType<typeof setTimeout>;
  let timeout2: ReturnType<typeof setTimeout>;

  const triggerClass = (className: string) => {
    if (target) {
      target.classList.remove(className);
      clearTimeout(timeout1);
      clearTimeout(timeout2);

      timeout1 = setTimeout(() => {
        target.classList.add(className);
      }, 17);

      timeout2 = setTimeout(() => {
        target.classList.remove(className);
      }, 500);
    }
  };

  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(target.innerText).then(
      function () {
        triggerClass("success");
      },
      function () {
        triggerClass("failure");
      }
    );
  } else {
    triggerClass("failure");
  }
}

export { onCopyClick };
