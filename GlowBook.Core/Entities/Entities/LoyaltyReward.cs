using System;

namespace GlowBook.Core.Entities
{
    public class LoyaltyReward
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int PointsEarned { get; set; }          // Pikët e fituara
        public string RewardType { get; set; }         // "Free Service", "Discount", "Free Nail Art"
        public int? ServiceId { get; set; }            // Nëse është shërbim falas
        public decimal? DiscountAmount { get; set; }   // Nëse është zbritje
        public DateTime EarnedDate { get; set; }
        public DateTime ExpiryDate { get; set; }
        public bool IsRedeemed { get; set; }
        public DateTime? RedeemedDate { get; set; }
        
        public bool IsValid => !IsRedeemed && DateTime.Now <= ExpiryDate;
        
        public LoyaltyReward()
        {
            EarnedDate = DateTime.Now;
            ExpiryDate = DateTime.Now.AddMonths(6);
            IsRedeemed = false;
        }
    }
}