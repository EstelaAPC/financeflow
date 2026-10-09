using FinanceFlow.Api.Models;

namespace FinanceFlow.Api.Repositories;

public interface ITransactionRepository
{
    List<Transaction> GetAll();

    Transaction Add(Transaction transaction);

    Transaction? GetById(Guid id);

    void Delete(Guid id);

    void Update(Transaction transaction);
}