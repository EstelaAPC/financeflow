using FinanceFlow.Api.DTOs;
using FinanceFlow.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FinanceFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TransactionsController : ControllerBase
{
    private readonly TransactionsService _transactionsService;

    public TransactionsController(TransactionsService transactionsService)
    {
        _transactionsService = transactionsService;
    }

    [HttpGet]
    public IActionResult GetTransactions()
    {
        var transactions = _transactionsService.GetTransactions();

        return Ok(transactions);
    }

    [HttpGet("{id}")]
    public IActionResult GetTransactionById(Guid id)
    {
        var transaction = _transactionsService.GetTransactionById(id);

        if (transaction is null)
        {
            return NotFound();
        }

        return Ok(transaction);
    }

[HttpDelete("{id}")]
public IActionResult DeleteTransaction(Guid id)
{
    var deleted = _transactionsService.DeleteTransaction(id);

    if (!deleted)
    {
        return NotFound();
    }

    return NoContent();
}
[HttpPut("{id}")]
public IActionResult UpdateTransaction(
    Guid id,
    [FromBody] CreateTransactionRequest request)
{
    var updated = _transactionsService.UpdateTransaction(id, request);

    if (!updated)
    {
        return NotFound();
    }

    return NoContent();
}

    [HttpPost]
    public IActionResult CreateTransaction(
        [FromBody] CreateTransactionRequest request)
    {
        var transaction = _transactionsService.CreateTransaction(request);

        return CreatedAtAction(
            nameof(GetTransactionById),
            new { id = transaction.Id },
            transaction
        );
    }
}