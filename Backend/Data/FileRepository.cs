using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using GlowBook.Backend.Interfaces;

namespace GlowBook.Backend.Data
{
    public class FileRepository<T> : IRepository<T> where T : class
    {
        private readonly string _filePath;
        private List<T> _cache;

        public FileRepository(string filePath)
        {
            _filePath = filePath;
            _cache = new List<T>();
        }

        public IEnumerable<T> GetAll()
        {
            return _cache.AsEnumerable();
        }

        public T GetById(Func<T, bool> predicate)
        {
            return _cache.FirstOrDefault(predicate);
        }

        public void Add(T entity)
        {
            if (entity == null) throw new ArgumentNullException(nameof(entity));
            _cache.Add(entity);
            Save();
        }

        public void Update(Func<T, bool> predicate, T updatedEntity)
        {
            var existing = _cache.FirstOrDefault(predicate);
            if (existing != null)
            {
                int index = _cache.IndexOf(existing);
                _cache[index] = updatedEntity;
                Save();
            }
        }

        public void Delete(Func<T, bool> predicate)
        {
            var entity = _cache.FirstOrDefault(predicate);
            if (entity != null)
            {
                _cache.Remove(entity);
                Save();
            }
        }

        public void Save()
        {
            Console.WriteLine($"[LOG]: Te dhenat u sinkronizuan ne {_filePath}");
        }
    }
}