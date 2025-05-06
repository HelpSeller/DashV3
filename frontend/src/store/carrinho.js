import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCarrinhoStore = create(
  persist(
    (set, get) => ({
      itens: [],

      adicionarProduto: (produto) => {
        const itensAtuais = get().itens;
        const existente = itensAtuais.find((item) => item.id === produto.id);

        if (existente) {
          const atualizados = itensAtuais.map((item) =>
            item.id === produto.id
              ? { ...item, quantidade: item.quantidade + 1 }
              : item
          );
          set({ itens: atualizados });
        } else {
          set({ itens: [...itensAtuais, { ...produto, quantidade: 1 }] });
        }
      },

      removerProduto: (id) => {
        set({ itens: get().itens.filter((item) => item.id !== id) });
      },

      alterarQuantidade: (id, quantidade) => {
        const atualizados = get().itens.map((item) =>
          item.id === id ? { ...item, quantidade } : item
        );
        set({ itens: atualizados });
      },

      limparCarrinho: () => set({ itens: [] }),

      totalItens: () => get().itens.reduce((acc, item) => acc + item.quantidade, 0),

      totalValor: () =>
        get().itens.reduce((acc, item) => acc + item.preco * item.quantidade, 0),
    }),
    {
      name: 'carrinho-storage', // nome no localStorage
      getStorage: () => localStorage,
    }
  )
);
