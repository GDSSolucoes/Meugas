import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Trash2, CheckCircle } from 'lucide-react';
import { ProductStock } from '@/entities/ProductStock';
import { useToast } from '@/components/ui/use-toast';

export default function DataCleanup() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleCleanup = async () => {
    if (!window.confirm("ATENÇÃO: Esta ação é irreversível e irá apagar TODOS os registros de estoque de TODOS os setores. Tem certeza que deseja continuar?")) {
      return;
    }

    setIsLoading(true);
    try {
      toast({
        title: "Aguarde...",
        description: "Iniciando a limpeza dos registros de estoque."
      });

      const allStocks = await ProductStock.list();
      
      if (allStocks.length === 0) {
        toast({
          title: "Nenhum registro encontrado",
          description: "O estoque já está limpo."
        });
        setIsDone(true);
        return;
      }
      
      await Promise.all(allStocks.map(stock => ProductStock.delete(stock.id)));

      toast({
        title: "Sucesso!",
        description: `Todos os ${allStocks.length} registros de estoque foram excluídos.`
      });
      setIsDone(true);
    } catch (error) {
      console.error("Erro ao limpar estoque:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao tentar limpar o estoque. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-amber-50 p-6 flex items-center justify-center">
      <Card className="w-full max-w-lg bg-white/90 backdrop-blur-sm border-red-200/60 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-red-700">
            <AlertTriangle className="w-6 h-6" />
            Ferramenta de Limpeza de Estoque
          </CardTitle>
          <CardDescription className="text-red-600">
            Use esta ferramenta com extremo cuidado. A ação não pode ser desfeita.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {isDone ? (
            <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
               <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <p className="text-green-800 font-medium text-lg">A limpeza foi concluída com sucesso!</p>
              <p className="text-sm text-slate-600 mt-2">
                Agora, ao acessar a tela de movimentação de estoque, novos registros serão criados corretamente. Por favor, me avise para que eu possa remover esta ferramenta.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-6 text-slate-700">
                Clique no botão abaixo para apagar permanentemente **TODOS** os registros da tabela de estoque de produtos (`ProductStock`).
                Esta ação é recomendada apenas se você encontrou dados duplicados ou inconsistentes e deseja recomeçar o controle de estoque.
              </p>
              <Button
                variant="destructive"
                className="w-full text-lg p-6 shadow-lg"
                onClick={handleCleanup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                ) : (
                  <Trash2 className="w-5 h-5 mr-3" />
                )}
                {isLoading ? 'Limpando...' : 'Limpar Todo o Estoque de Produtos'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}