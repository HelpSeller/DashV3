export function temPermissao(nomeModulo) {
    try {
      const modulos = JSON.parse(localStorage.getItem("modulos_ativos"));
      return Array.isArray(modulos) && modulos.includes(nomeModulo);
    } catch {
      return false;
    }
  }
  