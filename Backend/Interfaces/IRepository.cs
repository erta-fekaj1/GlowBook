using System;
using System.Collections.Generic;

namespace GlowBook.Backend.Interfaces
{
    public interface IRepository<T> where T : class
    {
        IEnumerable<T> GetAll();
        T GetById(Func<T, bool> predicate);
        void Add(T entity);
        void Update(Func<T, bool> predicate, T updatedEntity);
        void Delete(Func<T, bool> predicate);
        void Save();
    }
}