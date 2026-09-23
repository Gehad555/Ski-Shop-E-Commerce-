using System;
using System.Linq.Expressions;
using SkiShop.Core.Interfaces;

namespace SkiShop.Core.Specifications
{
    public class BaseSpecification<T>(Expression<Func<T, bool>>? criteria) : ISpecification<T>
    {

        protected BaseSpecification() : this(null) { }


        public Expression<Func<T, bool>>? Criteria => criteria;

        public Expression<Func<T, object>>? OrderBy {  get; private set; }

        public Expression<Func<T, object>>? OrderByDescending { get; private set; }

        public bool Isdistinct { get; private set; }


        protected void AddOrderBy(Expression<Func<T, object>> orderByExpression)
        {
            OrderBy = orderByExpression ?? throw new ArgumentNullException(nameof(orderByExpression));
        }

        protected void AddOrderByDescending(Expression<Func<T, object>> orderByDescendingExpression)
        {
            OrderByDescending = orderByDescendingExpression ?? throw new ArgumentNullException(nameof(orderByDescendingExpression));
        }

        protected void ApplyDistinct()
        {
            Isdistinct = true;
        }
    }
public class BaseSpecification<T, TResult>(Expression<Func<T, bool>>? criteria) : BaseSpecification<T>(criteria), ISpecification<T, TResult>
    {
        protected BaseSpecification() : this(null) { }

        public Expression<Func<T, TResult>>? Select { get; private set; }
        protected void AddSelect(Expression<Func<T, TResult>> selectExpression)
        {
            Select = selectExpression ?? throw new ArgumentNullException(nameof(selectExpression));
        }
    }

}
