using System.ComponentModel.DataAnnotations;
using FinanceFlow.Api.Models;

namespace FinanceFlow.Api.DTOs;

public class CreateTransactionRequest
{
    [Required]
    [MaxLength(200)]
    public string Description { get; set; } = string.Empty;

    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    [Required]
    public DateTime Date { get; set; }

    [Required]
    [MaxLength(100)]
    public string Category { get; set; } = string.Empty;

    [Required]
    public TransactionType Type { get; set; }

    [MaxLength(50)]
    public string? Source { get; set; }
}